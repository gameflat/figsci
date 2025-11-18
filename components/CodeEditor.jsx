'use client';

export default function CodeEditor({ code, onChange, onConvert, onClear }) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Excalidraw Code</h2>
        <div className="flex gap-2">
          <button
            onClick={onClear}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            disabled={!code}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto p-4">
        {code ? (
          <pre className="text-sm font-mono bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto">
            <code>{code}</code>
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <p className="text-lg font-medium">No code generated yet</p>
              <p className="text-sm mt-1">Generate a diagram to see the Excalidraw JSON here</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onConvert}
          disabled={!code}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            code
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Convert to Diagram
        </button>
        {code && (
          <p className="text-xs text-gray-500 mt-2 text-center">{code.length} characters</p>
        )}
      </div>
    </div>
  );
}

