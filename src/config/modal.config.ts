import type { ModalRegistry, ModalRoute } from "@/types/modal";

class ModalRegistryImpl implements ModalRegistry {
  private routes = new Map<string, ModalRoute>();
  private patterns: Array<{
    pattern: RegExp;
    handler: (match: RegExpMatchArray) => ModalRoute | null;
  }> = [];

  register(route: ModalRoute): void {
    this.routes.set(route.path, route);
  }

  registerPattern(
    pattern: RegExp,
    handler: (match: RegExpMatchArray) => ModalRoute | null,
  ): void {
    this.patterns.push({ pattern, handler });
  }

  find(path: string): ModalRoute | null {
    const exactMatch = this.routes.get(path);
    if (exactMatch) return exactMatch;

    for (const { pattern, handler } of this.patterns) {
      const match = pattern.exec(path);
      if (match) {
        const route = handler(match);
        if (route) return route;
      }
    }

    return null;
  }

  getPaths(): string[] {
    return Array.from(this.routes.keys());
  }
}

export const modalRegistry = new ModalRegistryImpl();
