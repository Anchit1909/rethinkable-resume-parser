import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const { memberId } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `http://192.168.0.110:3000/api/member/${memberId}`
        );
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [memberId]);

  if (!profile) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">{profile.name}'s Profile</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Work Experiences</h2>
        <ul>
          {profile.experiences.map((exp) => (
            <li key={exp.id} className="mb-4 p-4 bg-gray-100 rounded">
              <h3 className="text-lg font-semibold">
                {exp.title} at {exp.companyName}
              </h3>
              <p className="text-gray-700">
                <strong>Location:</strong> {exp.location || "N/A"}
              </p>
              <p className="text-gray-700">
                <strong>Duration:</strong> {exp.startDate} to{" "}
                {exp.endDate || "Present"}
              </p>
              <p className="text-gray-700">
                <strong>Description:</strong> {exp.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Skills</h2>
        <ul className="grid grid-cols-2 gap-4">
          {profile.skills.map((skill) => (
            <li key={skill.id} className="p-4 bg-gray-100 rounded">
              {skill.name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Profile;
