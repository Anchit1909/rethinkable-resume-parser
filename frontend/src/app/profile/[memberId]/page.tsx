"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, Briefcase } from "lucide-react";

interface Experience {
  id: string;
  title: string;
  companyName: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

interface Skill {
  id: string;
  name: string;
}

interface Profile {
  name: string;
  avatar: string;
  coverImage: string;
  username: string;
  location: string;
  experiences: Experience[];
  skills: Skill[];
}

const Profile = ({ params }: { params: { memberId: string } }) => {
  const memberId = params.memberId as string;
  console.log(memberId);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/member/${memberId}`
        );
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [memberId]);

  if (!profile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <div
        className="h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${profile.coverImage})` }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="-mt-24 sm:-mt-32 sm:flex sm:items-end sm:space-x-5">
          <div className="flex">
            <Avatar className="h-24 w-24 ring-4 ring-white sm:h-32 sm:w-32">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
            <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {profile.name}
              </h1>
              <p className="text-sm font-medium text-gray-500">
                {profile.username}
              </p>
            </div>
          </div>
        </div>
        <div className="hidden sm:block md:hidden mt-6 min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 truncate">
            {profile.name}
          </h1>
        </div>
      </div>

      <div className="mt-8 max-w-4xl mx-auto grid grid-cols-1 gap-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Briefcase className="mr-2 h-5 w-5" />
              Work Experiences
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.experiences.map((exp) => (
              <div key={exp.id} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold">{exp.title}</h3>
                <p className="text-sm text-gray-500">{exp.companyName}</p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <CalendarDays className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  {new Date(exp.startDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })}{" "}
                  -{" "}
                  {exp.endDate
                    ? new Date(exp.endDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                      })
                    : "Present"}
                </div>
                {exp.location && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0" />
                    {exp.location}
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-600">{exp.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge key={skill.id} variant="secondary">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="h-48 bg-gray-300" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="-mt-24 sm:-mt-32 sm:flex sm:items-end sm:space-x-5">
          <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
          <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
            <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-4xl mx-auto grid grid-cols-1 gap-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
