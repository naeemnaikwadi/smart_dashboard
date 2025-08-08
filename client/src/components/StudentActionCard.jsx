// client/src/pages/StudentDashboard.jsx
import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import StudentStatCard from "../components/StudentStatCard";
import StudentActionCard from "../components/StudentActionCard";
import "../components/style.css";

const StudentDashboard = () => {
  const statCards = [
    { title: "Courses Enrolled", value: 6 },
    { title: "Certificates Earned", value: 3 },
    { title: "Live Sessions Attended", value: 8 },
    { title: "Progress Level", value: "Advanced" },
  ];

  const actions = [
    {
      title: "My Courses",
      description: "Explore your enrolled courses and start learning.",
      actionText: "Go to Courses",
    },
    {
      title: "Join Live Session",
      description: "Participate in real-time instructor-led sessions.",
      actionText: "Join Now",
    },
    {
      title: "Classrooms",
      description: "Explore your enrolled classrooms and start learning.",
      actionText: "Explore",
    },
    {
      title: "Downloads",
      description: "View your downloaded resources and documents.",
      actionText: "View",
    },
  ];

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <StudentStatCard key={index} title={card.title} value={card.value} />
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actions.map((action, index) => (
            <StudentActionCard
              key={index}
              title={action.title}
              description={action.description}
              actionText={action.actionText}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
