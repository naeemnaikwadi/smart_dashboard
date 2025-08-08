const StudentClassroom = () => {
  const { classroomId } = useParams();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await axios.get(`/api/courses/classroom/${classroomId}`);
      setCourses(res.data);
    };
    fetchCourses();
  }, [classroomId]);

  return (
    <div className="course-grid">
      {courses.map(course => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
};