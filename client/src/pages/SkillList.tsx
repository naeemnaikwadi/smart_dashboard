import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSkills } from '../store/skillSlice';

export default function SkillList() {
  const dispatch = useAppDispatch();
  const skills = useAppSelector(state => state.skill.skills);

  useEffect(() => { dispatch(fetchSkills()); }, [dispatch]);

  return (
    <div>
      <h2>Skills</h2>
      <ul>
        {skills.map((skill: any) => (
          <li key={skill._id}>{skill.title}</li>
        ))}
      </ul>
    </div>
  );
}