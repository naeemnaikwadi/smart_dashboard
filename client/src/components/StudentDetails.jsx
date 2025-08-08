// components/StudentDetails.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TimeSpentChart from './charts/TimeSpentChart';
import ImprovementGraph from './charts/ImprovementGraph';

const StudentDetails = ({ studentId }) => {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      const res = await axios.get(`http://localhost:4000/api/student/details/${studentId}`);
      setStudent(res.data);
    };
    fetchStudent();
  }, [studentId]);

  if (!student) return <p className="text-gray-500">Loading student info...</p>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4 dark:text-white">{student.name}'s Details</h2>
      <p className="text-gray-700 dark:text-gray-300">Classroom: {student.classroom?.name}</p>
      <p className="text-gray-700 dark:text-gray-300">Course: {student.course?.name}</p>
      <p className="text-gray-700 dark:text-gray-300">Email: {student.email}</p>
      <p className="text-gray-700 dark:text-gray-300">Progress: {student.progress}%</p>

      <div className="mt-6">
        <h3 className="font-semibold dark:text-white">Time Spent Chart</h3>
        <TimeSpentChart data={student.timeSpentData} />
      </div>

      <div className="mt-6">
        <h3 className="font-semibold dark:text-white">Improvement Graph</h3>
        <ImprovementGraph data={student.improvementData} />
      </div>
    </div>
  );
};

export default StudentDetails;
