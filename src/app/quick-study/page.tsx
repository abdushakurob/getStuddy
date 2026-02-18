import { auth } from "@/auth";
import { getCourses } from "@/lib/actions-course";
import { startQuickStudy } from "@/lib/actions-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Upload, FileText, Image as ImageIcon, Video, File } from "lucide-react";

type Props = {
  searchParams: Promise<{ courseId?: string }>;
};

export default async function QuickStudyPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    return null; // Handle auth redirect
  }

  const courses = await getCourses();
  const { courseId: preselectedCourseId } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Quick Study</h1>
          <p className="text-lg text-muted-foreground">
            Stuck on something? Get instant help without any setup.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>What do you need help with?</CardTitle>
            <CardDescription>
              Tell me what's confusing you and I'll help you figure it out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={startQuickStudy} className="space-y-6">
              {/* Query input */}
              <div className="space-y-2">
                <Label htmlFor="query">Your question or topic</Label>
                <Textarea
                  id="query"
                  name="query"
                  placeholder="e.g., I don't understand supply curves in economics"
                  required
                  className="min-h-[100px] text-base resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about what confuses you - the more detail, the better I can help!
                </p>
              </div>

              {/* Course selector (if user has courses) */}
              {courses.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="courseId">Which course is this for? (optional)</Label>
                  <Select name="courseId" defaultValue={preselectedCourseId || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="I'll let you figure it out" />
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
                  <p className="text-xs text-muted-foreground">
                    I can link this to an existing course or create a new one
                  </p>
                </div>
              )}

              {/* File upload zone */}
              <div className="space-y-2">
                <Label>Upload materials (optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center gap-2 mb-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <Video className="h-8 w-8 text-muted-foreground" />
                      <File className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">
                      Drag & drop your files here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDFs, images, videos, or any study materials
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
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Choose Files
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Uploading materials helps me give you specific explanations from your course
                </p>
              </div>

              {/* Submit button */}
              <Button type="submit" size="lg" className="w-full">
                <Zap className="mr-2 h-5 w-5" />
                Start Learning Now
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Instant Help</h3>
                <p className="text-xs text-muted-foreground">
                  Start learning in seconds, no course setup needed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Your Materials</h3>
                <p className="text-xs text-muted-foreground">
                  Use your textbooks, notes, and slides for grounded answers
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Flexible</h3>
                <p className="text-xs text-muted-foreground">
                  Upload materials now or add them during the session
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
