import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import RetailerSidebar from "./components/RetailerSidebar";

export default async function  RetailerLayout({ children,}:{children:React.ReactNode;}) {
    
    //check authentification and role
    const session=await getServerSession(authOptions);
    if (!session ||session.role!=='RETAILER'){
        redirect('/auth');
    }

    return(
        <div  className="min-h-screen bg-gray-50">
            <RetailerSidebar/>
             <div className="ml-[72px] transition-all duration-300 pt-8">
                {children}
             </div>

        </div>
    );
}