import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Code, X } from "lucide-react";

interface WebDemo {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  htmlContent: string;
  metadata: {
    demoType: string;
    features: string[];
    style: string;
    userRequest: string;
  };
}

interface WebDemoPanelProps {
  projectId: string | null;
  chatId: string | null;
  isVisible: boolean;
  onClose: () => void;
}

export function WebDemoPanel({
  projectId,
  chatId,
  isVisible,
  onClose,
}: WebDemoPanelProps) {
  const [webDemos, setWebDemos] = useState<WebDemo[]>([]);
  const [selectedDemo, setSelectedDemo] = useState<WebDemo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (isVisible && projectId && chatId) {
      fetchWebDemos();
    }
  }, [isVisible, projectId, chatId]);

  const fetchWebDemos = async () => {
    if (!projectId || !chatId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/chats/${chatId}/web-demo`
      );
      if (response.ok) {
        const data = await response.json();
        setWebDemos(data.webDemos || []);
      }
    } catch (error) {
      console.error("Failed to fetch web demos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSelect = (demo: WebDemo) => {
    setSelectedDemo(demo);
    setIframeKey((prev) => prev + 1); // Force iframe refresh
  };

  const handleDownload = (demo: WebDemo) => {
    // Create a blob with the HTML content and download it
    const blob = new Blob([demo.htmlContent || ""], {
      type: "text/html",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${demo.name.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleViewCode = (demo: WebDemo) => {
    // This would open a modal or panel to show the HTML/CSS code
    console.log("View code for demo:", demo.id);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Web Demo Panel</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Sidebar - Demo List */}
          <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto">
            <h3 className="font-medium mb-4">Generated Demos</h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : webDemos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No web demos generated yet.</p>
                <p className="text-sm mt-2">
                  Ask AI to create a website or web demo in the chat!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {webDemos.map((demo) => (
                  <Card
                    key={demo.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedDemo?.id === demo.id
                        ? "ring-2 ring-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => handleDemoSelect(demo)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {demo.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-2">
                        {demo.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {demo.metadata?.demoType?.replace(/_/g, " ") ||
                            "demo"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {demo.metadata?.style || "modern"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(demo.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Main Content - Demo Preview */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedDemo ? (
              <>
                {/* Demo Header */}
                <div className="p-4 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{selectedDemo.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedDemo.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCode(selectedDemo)}
                      >
                        <Code className="h-4 w-4 mr-2" />
                        View Code
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(selectedDemo)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Demo Preview */}
                <div className="flex-1 p-4 bg-muted/20">
                  <div className="bg-white rounded-lg shadow-lg h-full overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <span className="text-xs text-gray-600 ml-2">
                        {selectedDemo.name}
                      </span>
                    </div>
                    <div className="h-full">
                      <iframe
                        key={iframeKey}
                        srcDoc={selectedDemo.htmlContent || ""}
                        className="w-full h-full border-0"
                        title={selectedDemo.name}
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a demo to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
