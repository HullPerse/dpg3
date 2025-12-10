import type { ComponentType, ReactNode } from "react";

export interface ModalSize {
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
}

export interface ModalConfig {
  title: string;
  description: string;
  size: ModalSize;
  showBackButton?: boolean;
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
}

export interface ModalRoute {
  path: string;
  component: ComponentType;
  config: ModalConfig;
}

export interface ModalRegistry {
  register(route: ModalRoute): void;
  registerPattern(
    pattern: RegExp,
    handler: (match: RegExpMatchArray) => ModalRoute | null
  ): void;
  find(path: string): ModalRoute | null;
  getPaths(): string[];
}

export interface ModalProps {
  path: string;
}

export interface ModalComponentProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export interface ModalHeaderProps {
  className?: string;
  children?: ReactNode;
}

export interface ModalFooterProps {
  className?: string;
  children?: ReactNode;
}

export interface ModalTitleProps {
  className?: string;
  children?: ReactNode;
}

export interface ModalDescriptionProps {
  className?: string;
  children?: ReactNode;
}