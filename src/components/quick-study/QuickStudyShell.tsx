'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Upload, FileText, Image as ImageIcon, Video, File, MessageSquare } from 'lucide-react';

interface CourseOption {
  id: string;
  title: string;
}

interface QuickStudyShellProps {
  courses: CourseOption[];
  preselectedCourseId?: string;
  action: (formData: FormData) => void | Promise<void>;
}

export default function QuickStudyShell({ courses, preselectedCourseId, action }: QuickStudyShellProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'upload'>('chat');

  const hasCourses = courses.length > 0;
  const defaultCourse = useMemo(() => preselectedCourseId || undefined, [preselectedCourseId]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 md:p-10">
      <div className="max-w-6xl mx-auto h-full">
        <div className="mb-6 md:mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Quick Study</h1>
              <p className="text-sm md:text-base text-gray-500">
                Start a focused session in seconds — no setup, just help.
              </p>
            </div>
          </div>

          {hasCourses && (
            <div className="w-full md:w-[340px]">
              <Label htmlFor="courseId" className="text-xs text-gray-500">Course (optional)</Label>
              <Select name="courseId" defaultValue={defaultCourse}>
                <SelectTrigger className="mt-2 rounded-2xl border-gray-200 bg-white">
                  <SelectValue placeholder="Let the AI decide" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__auto__">Let the AI decide</SelectItem>
                  <SelectItem value="__new__">Create new course</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[32px] shadow-lg shadow-gray-100/60 border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 md:px-10 pt-6">
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${activeTab === 'chat'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${activeTab === 'upload'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Upload
              </button>
            </div>

            {activeTab === 'chat' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('upload')}
                className="rounded-2xl"
              >
                <Upload className="mr-2 h-4 w-4" />
                Add document
              </Button>
            )}
          </div>

          <form action={action} className="px-6 md:px-10 pb-8 md:pb-10 pt-6">
            <div className={`transition-all ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
              <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-semibold tracking-widest">
                    <MessageSquare className="h-4 w-4" />
                    Your question
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-[24px] p-4">
                    <Textarea
                      id="query"
                      name="query"
                      placeholder="Tell me what you're stuck on..."
                      required
                      className="min-h-[180px] text-base resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Be specific. I can explain, break down steps, and pull from your materials.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" size="lg" className="rounded-2xl px-6">
                      <Zap className="mr-2 h-5 w-5" />
                      Start Quick Study
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('upload')}
                      className="rounded-2xl"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Add material first
                    </Button>
                  </div>
                </div>

                <div className="bg-[#f8f9fa] rounded-[24px] border border-gray-100 p-5 space-y-4">
                  <div className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Student-first</div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Fast start</p>
                        <p className="text-xs text-gray-500">No forms. Just ask and go.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Grounded answers</p>
                        <p className="text-xs text-gray-500">Upload notes for precise help.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
                        <Upload className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Always available</p>
                        <p className="text-xs text-gray-500">Add documents mid‑session.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`transition-all ${activeTab === 'upload' ? 'block' : 'hidden'}`}>
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Drop your materials</h2>
                    <p className="text-sm text-gray-500">PDFs, images, videos, or notes. We’ll handle the rest.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setActiveTab('chat')} className="rounded-2xl">
                    Back to chat
                  </Button>
                </div>

                <div className="border-2 border-dashed rounded-[28px] p-10 bg-[#f8f9fa] hover:bg-gray-50 transition-colors">
                  <div className="text-center space-y-3">
                    <div className="flex justify-center gap-3 mb-2 text-gray-400">
                      <FileText className="h-8 w-8" />
                      <ImageIcon className="h-8 w-8" />
                      <Video className="h-8 w-8" />
                      <File className="h-8 w-8" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">
                      Click or drag & drop to upload
                    </p>
                    <p className="text-xs text-gray-500">
                      You can still start now and add files later.
                    </p>
                    <input
                      type="file"
                      name="files"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.mp4,.mov,.doc,.docx,.txt"
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild className="rounded-2xl">
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Choose files
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" size="lg" className="rounded-2xl px-6">
                    <Zap className="mr-2 h-5 w-5" />
                    Start Quick Study
                  </Button>
                  <p className="text-xs text-gray-500 self-center">
                    Uploading helps me give specific, grounded explanations.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
