import type { Meta, StoryObj } from '@storybook/react-vite';
import { InlineSpinner, LoadingSpinner } from './LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    fullScreen: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {
  args: {
    message: '読み込み中...',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    message: '読み込み中...',
  },
};

export const Medium: Story = {
  args: {
    size: 'medium',
    message: 'データを取得しています...',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    message: '認証状態を確認中...',
  },
};

export const WithoutMessage: Story = {
  args: {
    size: 'medium',
  },
};

export const FullScreen: Story = {
  args: {
    size: 'large',
    message: 'アプリケーションを読み込み中...',
    fullScreen: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const Inline: StoryObj<typeof InlineSpinner> = {
  render: () => (
    <div className="flex items-center gap-2">
      <InlineSpinner />
      <span>処理中...</span>
    </div>
  ),
};
