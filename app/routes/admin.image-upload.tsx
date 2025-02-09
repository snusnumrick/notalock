import { json, redirect } from '@remix-run/node';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { createServerClient } from '@supabase/ssr';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useSubmit, useActionData, useLoaderData } from '@remix-run/react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const response = new Response();
    const cookies = request.headers.get('Cookie') ?? '';
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        get: key => {
          const cookie = cookies.split(';').find(c => c.trim().startsWith(`${key}=`));
          if (!cookie) return null;
          return cookie.split('=')[1];
        },
        set: (key, value) => {
          response.headers.append('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`);
        },
        remove: key => {
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
      throw redirect('/login');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      throw redirect('/unauthorized');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw json({ error: 'Failed to get session' }, { status: 500 });
    }

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
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('Test upload loader error:', error);
    throw json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const response = new Response();
    const formData = await request.formData();
    const imageData = formData.get('image');
    const fileName = formData.get('fileName');

    if (!imageData || !(imageData instanceof File)) {
      throw json({ error: 'Image file is required' }, { status: 400 });
    }

    if (!fileName || typeof fileName !== 'string') {
      throw json({ error: 'File name is required' }, { status: 400 });
    }

    const cookies = request.headers.get('Cookie') ?? '';
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        get: key => {
          const cookie = cookies.split(';').find(c => c.trim().startsWith(`${key}=`));
          if (!cookie) return null;
          return cookie.split('=')[1];
        },
        set: (key, value) => {
          response.headers.append('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`);
        },
        remove: key => {
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
      throw json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      throw json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    // Create a unique filename
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    const filePath = `test-uploads/${uniqueFileName}`;

    // Get the ArrayBuffer from the File
    const arrayBuffer = await imageData.arrayBuffer();

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, new Uint8Array(arrayBuffer), {
        cacheControl: '3600',
        upsert: false,
        contentType: imageData.type,
      });

    if (uploadError) {
      throw json(
        { error: 'Failed to upload image', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw json({ error: 'Failed to get public URL' }, { status: 500 });
    }

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
      },
      { status: 500 }
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
          <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
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

      {'error' in actionData! && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          Upload failed: {actionData.error}
          {actionData.details && <div className="mt-2 text-sm">Details: {actionData.details}</div>}
        </div>
      )}

      {'success' in actionData! && actionData.success && (
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

// [Component implementation remains the same]
