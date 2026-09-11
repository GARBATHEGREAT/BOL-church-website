import{getAdminEmail}from'../admin-auth';import AdminDashboard from'./dashboard';import AdminLogin from'./login-form';
export const dynamic='force-dynamic';
export default async function Admin(){const email=await getAdminEmail();return email?<AdminDashboard email={email}/>:<AdminLogin/>}
