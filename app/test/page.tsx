"use client";

import { useUser, useSession } from "@clerk/nextjs";

export default function TestPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { session } = useSession();

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Auth Test</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>isSignedIn:</strong> {isSignedIn ? "✅ Yes" : "❌ No"}</p>
        {user && (
          <>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
          </>
        )}
        <p><strong>Session exists:</strong> {session ? "✅ Yes" : "❌ No"}</p>
        <p><strong>Session ID:</strong> {session?.id || "None"}</p>
      </div>

      <div className="bg-blue-50 p-4 rounded">
        <h2 className="font-bold mb-2">Test API Call</h2>
        <button 
          onClick={async () => {
            const res = await fetch("/api/notes", { credentials: "include" });
            console.log("API Response:", res.status);
            const data = await res.json();
            console.log("Data:", data);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Test API Call
        </button>
      </div>
    </div>
  );
}