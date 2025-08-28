import axios from "axios";

export class FigmaService {
  private accessToken: string;
  private baseUrl = "https://api.figma.com/v1";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getFileData(fileUrl: string) {
    const fileKey = this.extractFileKey(fileUrl);
    if (!fileKey) {
      throw new Error("Invalid Figma URL");
    }

    const response = await axios.get(`${this.baseUrl}/files/${fileKey}`, {
      headers: {
        "X-Figma-Token": this.accessToken,
      },
    });

    return response.data;
  }

  private extractFileKey(url: string): string | null {
    const match = url.match(
      /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)(?:[\/?]|$)/
    );
    return match ? match[1] : null;
  }
}
