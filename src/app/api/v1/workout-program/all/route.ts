import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const userInfo = await currentUser();
    if (!userId || !userInfo) {
      return NextResponse.json(
        { message: "Please log in to continue", success: false },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { externalId: userInfo.id },
      select: {
        workoutPrograms: {
          include:{
            muscleGroups:true
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "No user exists in the database", success: false },
        { status: 401 }
      );
    }

    console.log(user)

    return NextResponse.json(
      {
        message: "Your workouts fetched successfully",
        success: true,
        data: user.workoutPrograms,
      },
      { status: 200 }
    );

  } catch (error:any) {
    return NextResponse.json(
      {
        message: error.message || "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}
