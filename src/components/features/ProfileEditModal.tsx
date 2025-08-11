'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, UpdateProfileFormData } from '@/lib/validations/profile';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { User } from '@/types/user';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { ProfileImageUpload } from '@/components/features/ProfileImageUpload';
import toast from 'react-hot-toast';
import { getImageURL } from '@/lib/cloudflare/images';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export function ProfileEditModal({ isOpen, onClose, user, onUpdate }: ProfileEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoURL, setPhotoURL] = useState(user.photoURL || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: user.displayName,
      bio: user.bio || '',
    },
  });

  const onSubmit = async (data: UpdateProfileFormData) => {
    setIsSubmitting(true);
    try {
      const updates: Partial<User> = {
        displayName: data.displayName,
        bio: data.bio || '',
      };

      if (photoURL !== user.photoURL) {
        updates.photoURL = photoURL;
      }

      const result = await updateUserProfile(user.uid, updates);
      
      if (result.success) {
        const updatedUser: User = {
          ...user,
          ...updates,
          updatedAt: new Date(),
        };
        onUpdate(updatedUser);
        toast.success('プロフィールを更新しました');
        onClose();
      } else {
        toast.error('プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setPhotoURL(user.photoURL || null);
    onClose();
  };

  const handleImageUpdate = (imageId: string) => {
    setPhotoURL(imageId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="プロフィール編集"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            プロフィール画像
          </label>
          <ProfileImageUpload
            currentImageId={photoURL}
            userId={user.uid}
            onImageUpdate={handleImageUpdate}
          />
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            表示名
          </label>
          <Input
            id="displayName"
            {...register('displayName')}
            error={errors.displayName?.message}
            placeholder="表示名を入力"
            fullWidth
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            自己紹介
          </label>
          <TextArea
            id="bio"
            {...register('bio')}
            error={errors.bio?.message}
            placeholder="自己紹介を入力（160文字まで）"
            rows={4}
            maxLength={160}
            fullWidth
          />
          <p className="mt-1 text-sm text-gray-500">
            {(watch('bio')?.length || 0)} / 160
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
          >
            保存
          </Button>
        </div>
      </form>
    </Modal>
  );
}