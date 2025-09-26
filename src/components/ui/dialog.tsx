import * as React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      // Compensate for scrollbar width
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in-0 duration-300"
        onClick={() => onOpenChange(false)}
      />
      {/* Dialog content */}
      <div className="relative animate-in fade-in-0 zoom-in-95 duration-300 w-full flex justify-center">
        <div className="w-full max-w-[95vw] sm:max-w-md lg:max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = '' }: DialogContentProps) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`relative bg-white rounded-xl shadow-lg w-full mx-auto max-h-[95vh] sm:max-h-[90vh] lg:max-h-[85vh] overflow-auto ${className}`}
    >
      {children}
    </div>
  );
};

const DialogHeader = ({ children, className = '' }: DialogHeaderProps) => (
  <div className={`p-4 sm:p-6 pb-2 sm:pb-4 pr-8 sm:pr-12 ${className}`}>
    {children}
  </div>
);

const DialogTitle = ({ children, className = '' }: DialogTitleProps) => (
  <h2
    className={`text-base sm:text-lg font-semibold text-gray-900 ${className}`}
  >
    {children}
  </h2>
);

const DialogDescription = ({
  children,
  className = '',
}: DialogDescriptionProps) => (
  <p className={`text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 ${className}`}>
    {children}
  </p>
);

const DialogFooter = ({ children, className = '' }: DialogFooterProps) => (
  <div
    className={`p-4 sm:p-6 pt-2 sm:pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 ${className}`}
  >
    {children}
  </div>
);

const DialogClose = ({
  children,
  onClose,
}: {
  children?: React.ReactNode;
  onClose: () => void;
}) => (
  <button
    onClick={onClose}
    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100 z-10 flex items-center"
  >
    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    {children}
  </button>
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
};
