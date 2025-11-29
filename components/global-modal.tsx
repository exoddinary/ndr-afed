"use client"

import { useModal } from './modal-context';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export const GlobalModal = () => {
  const { isOpen, closeModal, modalContent } = useModal();

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-4xl h-4/5 flex flex-col">
        {modalContent}
      </DialogContent>
    </Dialog>
  );
};
