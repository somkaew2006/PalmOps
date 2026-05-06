import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, Trash2, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'confirm';

interface NotificationOptions {
  title?: string;
  message: string;
  type?: NotificationType;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface NotificationContextType {
  showAlert: (message: string, type?: NotificationType, title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<NotificationOptions | null>(null);

  const showAlert = (message: string, type: NotificationType = 'info', title?: string) => {
    setOptions({ message, type, title: title || (type === 'error' ? 'เกิดข้อผิดพลาด' : type === 'success' ? 'สำเร็จ' : 'แจ้งเตือน') });
    setIsOpen(true);
  };

  const showConfirm = (message: string, onConfirm: () => void, title: string = 'ยืนยันการทำรายการ') => {
    setOptions({ message, type: 'confirm', onConfirm, title, confirmText: 'ยืนยัน', cancelText: 'ยกเลิก' });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (options?.onConfirm) {
      options.onConfirm();
    }
    setIsOpen(false);
  };

  const getIcon = () => {
    switch (options?.type) {
      case 'success': return <CheckCircle2 className="text-brand-light" size={48} />;
      case 'error': return <XCircle className="text-red-500" size={48} />;
      case 'warning': return <AlertCircle className="text-brand-amber" size={48} />;
      case 'confirm': return <Trash2 className="text-red-500" size={48} />;
      default: return <Info className="text-blue-400" size={48} />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {isOpen && options && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full opacity-10 blur-3xl ${options.type === 'error' || options.type === 'confirm' ? 'bg-red-500' : 'bg-brand-green'}`} />
            
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${
                options.type === 'error' || options.type === 'confirm' ? 'bg-red-500/10' : 
                options.type === 'success' ? 'bg-brand-green/10' : 'bg-brand-amber/10'
              }`}>
                {getIcon()}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                {options.title}
              </h3>
              
              <p className="text-neutral-400 mb-8 leading-relaxed">
                {options.message}
              </p>
              
              <div className="flex gap-3 w-full">
                {options.type === 'confirm' ? (
                  <>
                    <button 
                      onClick={handleClose}
                      className="flex-1 px-6 py-4 rounded-2xl bg-neutral-800 text-white font-bold hover:bg-neutral-700 transition-all cursor-pointer border border-white/5 active:scale-95"
                    >
                      {options.cancelText}
                    </button>
                    <button 
                      onClick={handleConfirm}
                      className="flex-1 px-6 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg shadow-red-600/20 transition-all cursor-pointer active:scale-95"
                    >
                      {options.confirmText}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleClose}
                    className={`w-full px-6 py-4 rounded-2xl font-bold transition-all cursor-pointer active:scale-95 ${
                      options.type === 'error' ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-brand-green text-[#064e3b] hover:bg-brand-light'
                    }`}
                  >
                    ตกลง
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
