// Client-Side Canvas WebM recording helper
export class CanvasClipRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  public start(canvas: HTMLCanvasElement, fps: number = 60): boolean {
    try {
      this.chunks = [];
      const stream = canvas.captureStream(fps);
      const mimeTypes = [
        'video/webm; codecs=vp9',
        'video/webm; codecs=vp8',
        'video/webm',
      ];
      let supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedType,
        videoBitsPerSecond: 8000000, // 8Mbps high quality
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100); // 100ms chunks
      return true;
    } catch (err) {
      console.error('Failed to initialize Canvas MediaRecorder:', err);
      return false;
    }
  }

  public stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('MediaRecorder not running'));
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }
}
