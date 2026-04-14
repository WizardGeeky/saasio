declare module "aos" {
  interface AosOptions {
    once?: boolean;
    duration?: number;
    easing?: string;
    offset?: number;
    anchorPlacement?: string;
  }

  const AOS: {
    init(options?: AosOptions): void;
    refresh(): void;
    refreshHard(): void;
  };

  export default AOS;
}
