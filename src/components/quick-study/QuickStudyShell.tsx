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
    <div className="h-full flex flex-col overflow-hidden">
      <form action={action} className="h-full flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-8 pt-8 pb-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quick Study</h1>
              <p className="text-sm text-gray-500">
                Start a focused session in seconds — no setup, just help.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasCourses && (
              <div className="w-[280px]">
                <Select name="courseId" defaultValue={defaultCourse}>
                  <SelectTrigger className="rounded-2xl border-gray-200 bg-white">
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
        </div>

        {/* Tab switcher */}
        <div className="shrink-0 px-8 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'chat'
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="inline-block h-4 w-4 mr-2" />
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'upload'
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Upload className="inline-block h-4 w-4 mr-2" />
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

        {/* Content area */}
        <div className="flex-1 overflow-auto px-8 py-8">
          <div className={`transition-all ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
            <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-semibold tracking-widest">
                  <MessageSquare className="h-4 w-4" />
                  Your question
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-[24px] p-5">
                  <Textarea
                    id="query"
                    name="query"
                    placeholder="Tell me what you're stuck on... Be specific so I can help you better."
                    required
                    className="min-h-[220px] text-base resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" size="lg" className="rounded-2xl px-8 py-6 text-base">
                    <Zap className="mr-2 h-5 w-5" />
                    Start Quick Study
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('upload')}
                    className="rounded-2xl px-6 py-6"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Add material first
                  </Button>
                </div>
              </div>

              <div className="bg-[#f8f9fa] rounded-[24px] border border-gray-100 p-6 space-y-5 self-start">
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Student-first</div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Fast start</p>
                      <p className="text-xs text-gray-500">No forms. Just ask and go.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Grounded answers</p>
                      <p className="text-xs text-gray-500">Upload notes for precise help.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
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
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Drop your materials</h2>
                  <p className="text-sm text-gray-500 mt-1">PDFs, images, videos, or notes. We'll handle the rest.</p>
                </div>
                <Button type="button" variant="outline" onClick={() => setActiveTab('chat')} className="rounded-2xl">
                  Back to chat
                </Button>
              </div>

              <div className="border-2 border-dashed rounded-[28px] p-16 bg-[#f8f9fa] hover:bg-gray-50 transition-colors">
                <div className="text-center space-y-4">
                  <div className="flex justify-center gap-4 mb-3 text-gray-400">
                    <FileText className="h-10 w-10" />
                    <ImageIcon className="h-10 w-10" />
                    <Video className="h-10 w-10" />
                    <File className="h-10 w-10" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    Click or drag & drop to upload
                  </p>
                  <p className="text-sm text-gray-500">
                    You can still start now and add files later during the session.
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
                    <Button type="button" variant="outline" size="lg" asChild className="rounded-2xl mt-2">
                      <span>
                        <Upload className="mr-2 h-5 w-5" />
                        Choose files
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button type="submit" size="lg" className="rounded-2xl px-8 py-6 text-base">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Quick Study
                </Button>
                <p className="text-sm text-gray-500">
                  Uploading helps me give specific, grounded explanations from your materials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
