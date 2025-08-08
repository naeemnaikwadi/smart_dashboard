import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StudentList from "../components/StudentList";
import StudentDetails from "../components/StudentDetails";
import axios from "axios";

export default function StudentInfo() {
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filters, setFilters] = useState({ classroom: "", course: "" });

  useEffect(() => {
    axios.get("/api/classrooms/filters").then((res) => {
      setClassrooms(res.data.classrooms);
      setCourses(res.data.courses);
    });
  }, []);

  const handleFilterChange = async (e) => {
    const updatedFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(updatedFilters);
    const res = await axios.get("/api/student/info", {
      params: updatedFilters,
    });
    setStudents(res.data);
  };

  const handleStudentSelect = async (id) => {
    const res = await axios.get(`/api/student/details/${id}`);
    setSelectedStudent(res.data);
  };

  return (
    <DashboardLayout role="instructor">
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Student Info</h1>

        <div className="grid grid-cols-2 gap-4">
          <select
            name="classroom"
            value={filters.classroom}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Select Classroom</option>
            {classrooms.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            name="course"
            value={filters.course}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StudentList students={students} onSelect={handleStudentSelect} />
          {selectedStudent && <StudentDetails student={selectedStudent} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
