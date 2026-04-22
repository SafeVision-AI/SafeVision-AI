'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';

import equal from 'fast-deep-equal';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 as LoaderIcon, X as XIcon, Mic, Send } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const clsx = (...args: unknown[]) => args.filter(Boolean).join(' ');

// Type Definitions
export interface Attachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
}

export interface UIMessage {
  id: string;
  content: string;
  role: string;
  attachments?: Attachment[];
}

export type VisibilityType = 'public' | 'private' | 'unlisted' | string;

// Utility Functions
const cn = (...inputs: unknown[]) => {
  return twMerge(clsx(...inputs));
};

// Button variants using cva (Integrated with SafeVixAI UI look)
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_4px_15px_rgba(37,99,235,0.3)] dark:shadow-[0_4px_15px_rgba(37,99,235,0.2)] active:scale-95 duration-150',
        destructive: 'border border-red-500/20 bg-red-400/20 text-red-500 hover:bg-red-400/30',
        outline: 'border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
        secondary: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700',
        ghost: 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50',
        link: 'text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[40px] w-full bg-transparent px-3 py-2 text-lg md:text-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 text-slate-800 dark:text-slate-200 resize-none overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

// Icons using currentColor
const StopIcon = ({ size = 16 }: { size?: number }) => (
  <svg height={size} viewBox="0 0 16 16" width={size} style={{ color: 'currentcolor' }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M3 3H13V13H3V3Z" fill="currentColor" />
  </svg>
);

const PaperclipIcon = ({ size = 16 }: { size?: number }) => (
  <svg height={size} strokeLinejoin="round" viewBox="0 0 16 16" width={size} style={{ color: 'currentcolor' }} className="-rotate-45">
    <path fillRule="evenodd" clipRule="evenodd" d="M10.8591 1.70735C10.3257 1.70735 9.81417 1.91925 9.437 2.29643L3.19455 8.53886C2.56246 9.17095 2.20735 10.0282 2.20735 10.9222C2.20735 11.8161 2.56246 12.6734 3.19455 13.3055C3.82665 13.9376 4.68395 14.2927 5.57786 14.2927C6.47178 14.2927 7.32908 13.9376 7.96117 13.3055L14.2036 7.06304L14.7038 6.56287L15.7041 7.56321L15.204 8.06337L8.96151 14.3058C8.06411 15.2032 6.84698 15.7074 5.57786 15.7074C4.30875 15.7074 3.09162 15.2032 2.19422 14.3058C1.29682 13.4084 0.792664 12.1913 0.792664 10.9222C0.792664 9.65305 1.29682 8.43592 2.19422 7.53852L8.43666 1.29609C9.07914 0.653606 9.95054 0.292664 10.8591 0.292664C11.7678 0.292664 12.6392 0.653606 13.2816 1.29609C13.9241 1.93857 14.2851 2.80997 14.2851 3.71857C14.2851 4.62718 13.9241 5.49858 13.2816 6.14106L13.2814 6.14133L7.0324 12.3835C7.03231 12.3836 7.03222 12.3837 7.03213 12.3838C6.64459 12.7712 6.11905 12.9888 5.57107 12.9888C5.02297 12.9888 4.49731 12.7711 4.10974 12.3835C3.72217 11.9959 3.50444 11.4703 3.50444 10.9222C3.50444 10.3741 3.72217 9.8484 4.10974 9.46084L4.11004 9.46054L9.877 3.70039L10.3775 3.20051L11.3772 4.20144L10.8767 4.70131L5.11008 10.4612C5.11005 10.4612 5.11003 10.4612 5.11 10.4613C4.98779 10.5835 4.91913 10.7493 4.91913 10.9222C4.91913 11.0951 4.98782 11.2609 5.11008 11.3832C5.23234 11.5054 5.39817 11.5741 5.57107 11.5741C5.74398 11.5741 5.9098 11.5054 6.03206 11.3832L6.03233 11.3829L12.2813 5.14072C12.2814 5.14063 12.2815 5.14054 12.2816 5.14045C12.6586 4.7633 12.8704 4.25185 12.8704 3.71857C12.8704 3.18516 12.6585 2.6736 12.2813 2.29643C11.9041 1.91925 11.3926 1.70735 10.8591 1.70735Z" fill="currentColor" />
  </svg>
);


function PureAttachmentsButton({
  fileInputRef,
  disabled,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  disabled: boolean;
}) {
  return (
    <button
      data-testid="attachments-button"
      className="p-2 h-fit rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50 !text-slate-600 dark:!text-white transition-colors disabled:opacity-50"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={disabled}
      aria-label="Attach files"
    >
      <PaperclipIcon size={24} />
    </button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton, (prev, next) => prev.disabled === next.disabled);


// Added Mic Button Component based on User Request
function PureMicButton({ disabled }: { disabled?: boolean }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <button
      data-testid="mic-button"
      className={cn(
        "p-2 h-fit rounded-full transition-all duration-200 !text-slate-600 dark:!text-white",
        isActive ? "!text-red-500 dark:!text-red-400 bg-red-500/10 hover:bg-red-500/20" : "hover:bg-slate-200 dark:hover:bg-slate-700/50"
      )}
      onClick={(event) => {
        event.preventDefault();
        setIsActive(!isActive);
        // Web Speech API integration pending
      }}
      disabled={disabled}
      aria-label="Use microphone"
    >
      <Mic size={26} className={cn(isActive && "animate-pulse")} />
    </button>
  );
}
const MicButton = memo(PureMicButton);


function PureStopButton({ onStop }: { onStop: () => void }) {
  return (
    <Button
      data-testid="stop-button"
      className="p-2 h-fit rounded-full flex items-center justify-center hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
      onClick={(event) => {
        event.preventDefault();
        onStop();
      }}
      aria-label="Stop generating"
    >
      <StopIcon size={18} />
    </Button>
  );
}

const StopButton = memo(PureStopButton, (prev, next) => prev.onStop === next.onStop);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
  attachments,
  canSend,
  isGenerating,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
  attachments: Array<Attachment>;
  canSend: boolean;
  isGenerating: boolean;
}) {
  const isDisabled = uploadQueue.length > 0 || !canSend || isGenerating || (input.trim().length === 0 && attachments.length === 0);

  return (
    <button
      data-testid="send-button"
      className={cn(
        "p-2 h-fit rounded-full transition-all duration-200 bg-transparent flex items-center justify-center disabled:opacity-100 disabled:cursor-not-allowed",
        !isDisabled ? "!text-blue-600 dark:!text-white hover:bg-slate-200 dark:hover:bg-slate-700/50 scale-105" : "!text-slate-600 dark:!text-white hover:bg-transparent"
      )}
      onClick={(event) => {
        event.preventDefault();
        if (!isDisabled) {
          try { if (navigator?.vibrate) navigator.vibrate(50); } catch (e) { console.error('Vibration failed:', e); }
          submitForm();
        }
      }}
      disabled={isDisabled}
      aria-label="Send message"
    >
      <Send size={24} className={cn(!isDisabled && "translate-x-[1px] translate-y-[-1px] transition-transform")} />
    </button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length) return false;
  if (prevProps.attachments.length !== nextProps.attachments.length) return false;
  if (prevProps.attachments.length > 0 && !equal(prevProps.attachments, nextProps.attachments)) return false;
  if (prevProps.canSend !== nextProps.canSend) return false;
  if (prevProps.isGenerating !== nextProps.isGenerating) return false;
  return true;
});


const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div data-testid="input-attachment-preview" className="flex flex-col gap-1 shrink-0">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl relative flex flex-col items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
        {contentType?.startsWith('image/') && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={name ?? 'An image attachment'}
            className="rounded-xl size-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center p-1">
            {name?.split('.').pop() || 'FILE'}
          </div>
        )}

        {isUploading && (
          <div
            data-testid="input-attachment-loader"
            className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm"
          >
            <LoaderIcon className="size-4 animate-spin text-slate-700 dark:text-slate-300" />
          </div>
        )}
      </div>
    </div>
  );
};


// Main Component
export interface MultimodalInputProps {
  chatId?: string;
  messages?: Array<UIMessage>;
  attachments?: Array<Attachment>;
  setAttachments?: Dispatch<SetStateAction<Array<Attachment>>>;
  onSendMessage?: (params: { input: string; attachments: Attachment[] }) => void;
  onStopGenerating?: () => void;
  isGenerating?: boolean;
  canSend?: boolean;
  className?: string;
  selectedVisibilityType?: VisibilityType;
  // Local fallback states if not provided by parent
  value?: string;
  onChange?: (val: string) => void;
}

export function PureMultimodalInput({
  chatId = 'default-chat',
  messages = [],
  attachments: externalAttachments,
  setAttachments: externalSetAttachments,
  onSendMessage,
  onStopGenerating,
  isGenerating = false,
  canSend = true,
  className,
  selectedVisibilityType = 'public',
  value,
  onChange
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use local state if parent doesn't provide controlled props
  const [localInput, setLocalInput] = useState('');
  const [localAttachments, setLocalAttachments] = useState<Array<Attachment>>([]);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const input = value !== undefined ? value : localInput;
  const setInput = onChange ? onChange : setLocalInput;

  const attachments = externalAttachments || localAttachments;
  const setAttachments = externalSetAttachments || setLocalAttachments;

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const resetHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.rows = 1;
      adjustHeight();
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [input]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  // Placeholder File Upload Function
  const uploadFile = async (file: File): Promise<Attachment | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const mockUrl = URL.createObjectURL(file);
          const mockAttachment: Attachment = {
            url: mockUrl,
            name: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
          };
          resolve(mockAttachment);
        } catch (error) {
          console.error('Failed to create object URL for preview:', error);
          resolve(undefined);
        } finally {
          setUploadQueue(currentQueue => currentQueue.filter(name => name !== file.name));
        }
      }, 700);
    });
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      setUploadQueue(currentQueue => [...currentQueue, ...files.map((file) => file.name)]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
      const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE);

      const uploadPromises = validFiles.map((file) => uploadFile(file));
      const uploadedAttachments = await Promise.all(uploadPromises);

      const successfullyUploadedAttachments = uploadedAttachments.filter(
        (attachment): attachment is Attachment => attachment !== undefined,
      );

      setAttachments((current) => [...current, ...successfullyUploadedAttachments]);
    },
    [setAttachments]
  );

  const handleRemoveAttachment = useCallback(
    (attachmentToRemove: Attachment) => {
      if (attachmentToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachmentToRemove.url);
      }
      setAttachments((current) =>
        current.filter(
          (attachment) => attachment.url !== attachmentToRemove.url || attachment.name !== attachmentToRemove.name
        )
      );
      textareaRef.current?.focus();
    },
    [setAttachments]
  );

  const submitForm = useCallback(() => {
    if (input.trim().length === 0 && attachments.length === 0) {
      return;
    }

    if (onSendMessage) {
      onSendMessage({ input, attachments });
    }

    setInput('');
    setAttachments([]);

    attachments.forEach(att => {
      if (att.url.startsWith('blob:')) {
        URL.revokeObjectURL(att.url);
      }
    });

    resetHeight();
    textareaRef.current?.focus();

  }, [input, attachments, onSendMessage, setAttachments, setInput, resetHeight]);

  const isAttachmentDisabled = isGenerating || uploadQueue.length > 0;

  return (
    <div className={cn("relative w-full md:max-w-3xl md:mx-auto flex flex-col pointer-events-auto", className)}>
      {/* Hidden file input */}
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        disabled={isAttachmentDisabled}
      />

      <div className={cn(
        "flex flex-col w-full bg-white/90 dark:bg-[#1a2133]/90 backdrop-blur-2xl rounded-[32px] border border-slate-200/60 dark:border-white/5 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all p-1.5 shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
      )}>

        {/* Attachments Preview row */}
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div className="flex pt-2 px-3 pb-2 gap-3 overflow-x-auto items-end scroll-smooth [scrollbar-width:none]">
            <AnimatePresence>
              {attachments.map((attachment) => (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={attachment.url || attachment.name} className="relative group shrink-0">
                  <PreviewAttachment attachment={attachment} isUploading={false} />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1.5 -right-1.5 !size-5 rounded-full p-0 flex items-center justify-center shadow-sm"
                    onClick={() => handleRemoveAttachment(attachment)}
                  >
                    <XIcon className="size-3" />
                  </Button>
                </motion.div>
              ))}
              {uploadQueue.map((filename, index) => (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={`upload-${filename}-${index}`} className="shrink-0">
                  <PreviewAttachment attachment={{ url: '', name: filename, contentType: '', size: 0 }} isUploading={true} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Input & Action Row */}
        <div className="flex items-center gap-1 w-full pl-1 pr-1 pb-1">
          <AttachmentsButton fileInputRef={fileInputRef} disabled={isAttachmentDisabled} />

          <Textarea
            ref={textareaRef}
            placeholder="Ask AI anything..."
            value={input}
            onChange={handleInput}
            rows={1}
            autoFocus
            disabled={!canSend || isGenerating || uploadQueue.length > 0}
            className="text-slate-800 dark:text-slate-200 placeholder:text-slate-500 py-3 font-medium max-h-[120px] overflow-y-auto w-full"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                const canSubmit = canSend && !isGenerating && uploadQueue.length === 0 && (input.trim().length > 0 || attachments.length > 0);
                if (canSubmit) {
                  submitForm();
                }
              }
            }}
          />

          <MicButton />

          <div className="flex items-center">
            {isGenerating ? (
              <StopButton onStop={onStopGenerating || (() => { })} />
            ) : (
              <SendButton
                submitForm={submitForm}
                input={input}
                uploadQueue={uploadQueue}
                attachments={attachments}
                canSend={canSend}
                isGenerating={isGenerating}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default PureMultimodalInput;
