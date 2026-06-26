import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ isOpen, title, message, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#1c1a17] bg-opacity-40 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-[#fcaecb]/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-[#e11d48]" />
            </div>
            <h3 className="text-lg font-bold text-[#1c1a17]">{title}</h3>
            <p className="text-sm text-[#878077] mt-2 mb-6">{message}</p>
            
            <div className="flex gap-3 w-full">
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl font-bold text-[#1c1a17] hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 bg-[#e11d48] text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
