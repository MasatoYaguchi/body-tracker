import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorDisplay, InlineError } from './ErrorDisplay';

const meta: Meta<typeof ErrorDisplay> = {
  title: 'UI/ErrorDisplay',
  component: ErrorDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['error', 'warning', 'info'],
    },
    fullScreen: {
      control: 'boolean',
    },
    showRetry: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorDisplay>;

export const Default: Story = {
  args: {
    title: 'エラーが発生しました',
    message: 'データの取得に失敗しました。時間をおいて再度お試しください。',
  },
};

export const WithRetry: Story = {
  args: {
    title: 'データ読み込みエラー',
    message: 'ネットワークエラーが発生しました。',
    showRetry: true,
    onRetry: () => alert('再試行'),
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: '注意',
    message: '一部の機能が利用できない状態です。',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'お知らせ',
    message: 'メンテナンスのため、一時的にサービスを停止しています。',
  },
};

export const FullScreen: Story = {
  args: {
    title: 'ページが見つかりません',
    message: 'お探しのページは存在しないか、移動した可能性があります。',
    fullScreen: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const Inline: StoryObj<typeof InlineError> = {
  render: () => (
    <div className="max-w-md">
      <InlineError message="入力内容に誤りがあります" onDismiss={() => alert('閉じる')} />
    </div>
  ),
};

export const InlineWithoutDismiss: StoryObj<typeof InlineError> = {
  render: () => (
    <div className="max-w-md">
      <InlineError message="このフィールドは必須です" />
    </div>
  ),
};
