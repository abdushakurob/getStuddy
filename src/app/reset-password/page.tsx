import ResetPasswordForm from './reset-password-form';

type Props = {
    searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
    const { token } = await searchParams;
    return <ResetPasswordForm token={token || ''} />;
}
