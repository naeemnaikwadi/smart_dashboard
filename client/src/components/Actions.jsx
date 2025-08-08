import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Star, Video } from 'lucide-react';
//import ActionCard from '../components/ActionCard'; // Make sure this exists

function ActionCard({ title, description, onClick, icon }) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-start gap-4 cursor-pointer"
    >
      <div className="p-3 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">{title}</h3>
        <p className="text-sm text-blue-800 dark:text-blue-300">{description}</p>
      </div>
    </div>
  );
}

export default function Action({ role }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const allFileInputRef = useRef(null);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const handleStructuredFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Handle .xlsx or .bib parsing logic here
    console.log("Structured file uploaded:", file.name);
  };

  const handleAllFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Handle general file upload logic here
    console.log("General file uploaded:", file.name);
  };

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Actions
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          title="Create / Manage Courses"
          description="Create new or manage existing courses"
          onClick={() => navigate('/instructor-courses')}
          icon={<BookOpen size={24} />}
        />

        <ActionCard
          title="Manage Live Sessions"
          description="Schedule or manage upcoming sessions"
          onClick={() => navigate('/live-session')}
          icon={<Video size={24} />}
        />

        <ActionCard
          title="Upload Structured Files"
          description="Upload Excel (.xlsx) or BibTeX (.bib) files"
          onClick={() => fileInputRef.current.click()}
          icon={<Users size={24} />}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx, .xls, .bib"
          onChange={handleStructuredFileUpload}
        />

        <ActionCard
          title="Upload Any File"
          description="Upload PDFs, MP4s, DOCs, images, etc."
          onClick={() => allFileInputRef.current.click()}
          icon={<Users size={24} />}
        />
        <input
          type="file"
          ref={allFileInputRef}
          className="hidden"
          onChange={handleAllFileUpload}
        />

        <ActionCard
          title="Add Resource Link"
          description="Add YouTube, Vimeo, or article links"
          onClick={() => setShowLinkInput(!showLinkInput)}
          icon={<Star size={24} />}
        />

        <ActionCard
          title="Student Progress Tracker"
          description="Track progress of students across courses"
          onClick={() => navigate('/student-progress')}
          icon={<Star size={24} />}
        />
      </div>
    </section>
  );
}
