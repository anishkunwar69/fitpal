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

    let user = await prisma.user.findUnique({
      where: { externalId: userInfo.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          externalId: userInfo.id,
          email: userInfo.emailAddresses[0].emailAddress,
        },
      });

      return NextResponse.json(
        {
          message: "User created successfully",
          success: true,
          data: user,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        message: "User already exists",
        success: true,
        data: user,
      },
      { status: 200 }
    );

  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}
