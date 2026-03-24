import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Modalは isOpen が必要なため、ラッパーコンポーネントを使用
function ModalDemo({
  title,
  children,
  footer,
}: {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        モーダルを開く
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} footer={footer}>
        {children}
      </Modal>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <ModalDemo title="基本的なモーダル">
      <p className="text-gray-600">これはモーダルの内容です。</p>
    </ModalDemo>
  ),
};

export const WithTitle: Story = {
  render: () => (
    <ModalDemo title="タイトル付きモーダル">
      <p className="text-gray-600">タイトルが表示されるモーダルです。</p>
    </ModalDemo>
  ),
};

export const WithFooter: Story = {
  render: () => {
    const Footer = () => (
      <>
        <button
          type="button"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          キャンセル
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          保存
        </button>
      </>
    );

    return (
      <ModalDemo title="フッター付きモーダル" footer={<Footer />}>
        <p className="text-gray-600">フッターにボタンが配置されたモーダルです。</p>
      </ModalDemo>
    );
  },
};

export const LongContent: Story = {
  render: () => (
    <ModalDemo title="長いコンテンツ">
      <div className="space-y-4">
        <p className="text-gray-600">
          これは長いコンテンツを持つモーダルのデモです。スクロールが必要な場合の動作を確認できます。
        </p>
        <p className="text-gray-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua.
        </p>
        <p className="text-gray-600">
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
          commodo consequat.
        </p>
        <p className="text-gray-600">
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
          nulla pariatur.
        </p>
      </div>
    </ModalDemo>
  ),
};

export const WithForm: Story = {
  render: () => {
    const Footer = () => (
      <>
        <button
          type="button"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          送信
        </button>
      </>
    );

    return (
      <ModalDemo title="フォーム入力" footer={<Footer />}>
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="山田太郎"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>
        </form>
      </ModalDemo>
    );
  },
};
