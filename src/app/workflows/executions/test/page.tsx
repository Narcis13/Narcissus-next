export default function TestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Executions Test Page</h1>
      <p>If you can see this, the routing is working.</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Test Links:</h2>
        <ul className="space-y-2">
          <li>
            <a href="/workflows/e40a3e7f-e8b5-4dd3-9fe3-2ae6f28b07c6/executions" className="text-blue-500 hover:underline">
              Test Workflow Executions (Direct Link)
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}