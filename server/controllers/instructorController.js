exports.getInstructorStats = async (req, res) => {
    try {
      // Dummy data — replace with real DB queries later
      const stats = {
        totalCourses: 12,
        totalStudents: 320,
        averageRating: 4.7,
      };
      res.json(stats);
    } catch (err) {
      console.error('Failed to fetch instructor stats:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  