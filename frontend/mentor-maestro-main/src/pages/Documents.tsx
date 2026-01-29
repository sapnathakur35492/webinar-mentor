import { MainLayout } from "@/components/layout/MainLayout";
import { useDocuments, DocumentType } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  FileVideo, 
  FileAudio,
  FolderOpen,
  Trash2,
  Download,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const typeConfig: Record<DocumentType, { icon: typeof FileText; color: string; label: string }> = {
  onboarding_doc: { icon: FileText, color: "text-blue-400", label: "Onboarding" },
  hook_analysis: { icon: FileText, color: "text-amber-400", label: "Hook Analysis" },
  transcript: { icon: FileText, color: "text-green-400", label: "Transcript" },
  video: { icon: FileVideo, color: "text-purple-400", label: "Video" },
  audio: { icon: FileAudio, color: "text-pink-400", label: "Audio" },
  slide_deck: { icon: FileText, color: "text-primary", label: "Slides" },
  other: { icon: FileText, color: "text-muted-foreground", label: "Other" },
};

export default function Documents() {
  const { documents, isLoading, deleteDocument } = useDocuments();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
            <p className="text-muted-foreground mt-1">Upload and manage your source materials</p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground glow">
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
        </div>

        {/* Upload Zone */}
        <div className="glass rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-secondary p-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-foreground font-medium">Drop files here or click to upload</p>
              <p className="text-sm text-muted-foreground mt-1">
                Onboarding docs, hook analyses, transcripts, recordings
              </p>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading documents...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No documents yet</h3>
            <p className="text-muted-foreground mt-1">
              Upload your onboarding materials to get started
            </p>
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Uploaded</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Size</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const config = typeConfig[doc.type];
                  const Icon = config.icon;
                  
                  return (
                    <tr 
                      key={doc.id} 
                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("rounded-lg bg-secondary p-2", config.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{doc.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="bg-secondary text-muted-foreground">
                          {config.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{doc.file_size || "—"}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteDocument.mutate(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
