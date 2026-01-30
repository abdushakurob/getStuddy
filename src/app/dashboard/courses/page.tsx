import { getCourses } from '@/lib/actions-course';
import CreateCourseForm from '@/components/courses/CreateCourseForm';
import CourseCard from '@/components/courses/CourseCard';
import { BookOpen } from 'lucide-react';

export default async function CoursesPage() {
    const courses = await getCourses();

    return (
        <div className="h-full flex flex-col p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-black text-[#1F2937]">My Courses</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage your syllabus and materials.</p>
                </div>
                <CreateCourseForm />
            </div>

            {/* Grid */}
            {courses.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center pb-20 opacity-60">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <BookOpen size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Courses Yet</h3>
                    <p className="text-gray-400 max-w-sm">Create your first course to start organizing your files and generating study plans.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );
}
