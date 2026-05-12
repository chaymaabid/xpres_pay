import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default async function  AdminLayout({ children,}:{children:React.ReactNode;}) {
    
    const session=await getServerSession(authOptions);
    if (!session ||session.role!=='ADMIN'){
        redirect('/auth');
    }

    return(
        <div  className="min-h-screen bg-gray-50">
            <AdminSidebar/>
             <div className=" ml-[72px] transition-all duration-300 pt-8">
                <main>{children}</main>
             </div>

        </div>
    );
}