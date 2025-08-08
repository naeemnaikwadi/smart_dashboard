import axios from 'axios';

const API = 'http://localhost:4000/api/learning-paths';

export const createLearningPath = (data) => axios.post(`${API}/create`, data);
export const fetchAllLearningPaths = () => axios.get(`${API}/all`);
