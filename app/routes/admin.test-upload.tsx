import { json, redirect } from '@remix-run/node';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { createServerClient } from '@supabase/ssr';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useSubmit, useActionData, useLoaderData } from '@remix-run/react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const cookies = request.headers.get('Cookie') ?? '';

  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get: key => {
        const cookie = cookies.split(';').find(c => c.trim().startsWith(`${key}=`));
        if (!cookie) return null;
        return cookie.split('=')[1];
      },
      set: (key, value, options) => {
        response.headers.append('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`);
      },
      remove: (key, options) => {
        response.headers.append(
          'Set-Cookie',
          `${key}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        );
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirect('/login');
  }

  // Simple role check without JOIN
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return redirect('/unauthorized');
  }

  // Get the session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return json(
    {
      supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
      },
      user,
      session,
      profile,
    },
    {
      headers: response.headers,
    }
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response();
  const formData = await request.formData();
  const imageData = formData.get('image') as File;
  const fileName = formData.get('fileName') as string;

  if (!imageData || !fileName) {
    return json({ error: 'No image provided' }, { status: 400 });
  }

  const cookies = request.headers.get('Cookie') ?? '';

  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get: key => {
        const cookie = cookies.split(';').find(c => c.trim().startsWith(`${key}=`));
        if (!cookie) return null;
        return cookie.split('=')[1];
      },
      set: (key, value, options) => {
        response.headers.append('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`);
      },
      remove: (key, options) => {
        response.headers.append(
          'Set-Cookie',
          `${key}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        );
      },
    },
  });

  // Verify session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  // Simple role check
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  try {
    // Create a unique filename
    const timestamp = new Date().getTime();
    const uniqueFileName = `${timestamp}-${fileName}`;

    // Get the ArrayBuffer from the File
    const arrayBuffer = await imageData.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`test-uploads/${uniqueFileName}`, new Uint8Array(arrayBuffer), {
        cacheControl: '3600',
        upsert: false,
        contentType: imageData.type,
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(`test-uploads/${uniqueFileName}`);

    return json(
      {
        success: true,
        url: urlData.publicUrl,
        profile: profile,
      },
      { headers: response.headers }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : String(error),
        profile: profile,
      },
      { status: 500, headers: response.headers }
    );
  }
};

// Rest of the component remains the same...
export default function TestUpload() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    'idle'
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);

    // Create previews
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  }, []);

  const handleUpload = async (file: File) => {
    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('fileName', file.name);

    submit(formData, { method: 'post', encType: 'multipart/form-data' });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Image Upload</h1>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>

      {/* Preview Section */}
      {previews.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Preview:</h2>
          <div className="grid grid-cols-3 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-48 object-cover rounded"
                />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(preview);
                    setPreviews(prev => prev.filter((_, i) => i !== index));
                    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  ✕
                </button>
                <button
                  onClick={() => handleUpload(uploadedFiles[index])}
                  className="mt-2 w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
                >
                  Upload
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploadStatus === 'uploading' && (
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded">Uploading...</div>
      )}

      {actionData?.error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          Upload failed: {actionData.error}
          {actionData.details && <div className="mt-2 text-sm">Details: {actionData.details}</div>}
        </div>
      )}

      {actionData?.success && (
        <div className="mt-4">
          <div className="p-4 bg-green-50 text-green-700 rounded">Upload successful!</div>
          <div className="mt-2">
            <strong>Public URL:</strong>{' '}
            <a
              href={actionData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {actionData.url}
            </a>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(
            {
              filesCount: uploadedFiles.length,
              fileDetails: uploadedFiles.map(f => ({
                name: f.name,
                size: f.size,
                type: f.type,
              })),
              user: loaderData.user.email,
              uploadStatus,
              actionData,
              session: loaderData.session ? 'Present' : 'Missing',
              profile: loaderData.profile,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
