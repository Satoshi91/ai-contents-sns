'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/ui/AuthModal';

export default function SignUpPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = () => {
    setIsModalOpen(false);
    router.push('/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          アカウント作成
        </h2>
        <p className="text-gray-600">
          モーダルが表示されない場合は、
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 hover:text-blue-500 cursor-pointer transition-colors duration-200 ml-1"
          >
            こちらをクリック
          </button>
        </p>
      </div>
      
      <AuthModal
        isOpen={isModalOpen}
        onClose={handleClose}
        initialMode="signup"
      />
    </div>
  );
}