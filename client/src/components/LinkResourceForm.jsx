import React from 'react';

export default function LinkResourceForm({
  linkData,
  setLinkData,
  handleLinkSubmit,
}) {
  return (
    <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md max-w-xl mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        Add Link Resource
      </h3>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={linkData.title}
          onChange={(e) => setLinkData({ ...linkData, title: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white"
        />
        <input
          type="text"
          placeholder="Type (e.g. video, article)"
          value={linkData.type}
          onChange={(e) => setLinkData({ ...linkData, type: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white"
        />
        <input
          type="text"
          placeholder="URL (e.g. https://youtube.com/...)"
          value={linkData.url}
          onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white"
        />
        <button
          onClick={handleLinkSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          Submit Link
        </button>
      </div>
    </section>
  );
}
