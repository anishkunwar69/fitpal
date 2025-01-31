'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCcw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type TimeFrame = 'week' | 'month' | 'year';


interface ExerciseHistoryData {
  date: string;
  totalSets: number;
  repRange: string;
  achievedReps: number;
  avgWeight: number;
  achievementRate: number;
}

export default function ExerciseHistory() {
    const router = useRouter();
    const params = useParams();
    const exerciseId = params?.exerciseId as string;
    
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data, isLoading, isError, error, refetch } = useQuery<{ data: ExerciseHistoryData[]; message: string }>({
        queryKey: ['exerciseHistory', exerciseId, timeFrame],
        queryFn: async () => {
            const response = await fetch(`/api/v1/exercises/history/${timeFrame}/${exerciseId}`);
            const result = await response.json();
            
            if (response.status === 404) {
                return result;
            }
            
            if (!result.success) {
                throw new Error(result.message);
            }
            return result;
        },
    });

    const paginatedData = data?.data.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ) || [];

    const totalPages = Math.ceil((data?.data.length || 0) / itemsPerPage);

    if (isLoading) {
        return (
            <div className="min-h-[90vh] flex items-center justify-center p-4">
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md w-full">
                    <div className="bg-orange-50 rounded-full p-6 mb-6">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Loading Exercise History
                    </h3>
                    <p className="text-gray-600">
                        Please wait while we fetch your exercise history
                    </p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-[90vh] flex items-center justify-center p-4">
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md w-full">
                    <div className="bg-red-50 rounded-full p-6 mb-6">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Failed to Load Exercise History
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {error instanceof Error ? error.message : 'Something went wrong while fetching exercise history'}
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Try Again
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center px-6 py-3 rounded-xl border border-orange-200 text-orange-600 font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-orange-100 text-gray-600 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            <Tabs 
                defaultValue="week" 
                value={timeFrame}
                onValueChange={(value) => {
                    setTimeFrame(value as TimeFrame);
                    setCurrentPage(1);
                }}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-3 p-1 bg-orange-50 rounded-lg sm:rounded-xl">
                    <TabsTrigger 
                        value="week"
                        className="text-sm sm:text-base data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md sm:rounded-lg transition-all"
                    >
                        This Week
                    </TabsTrigger>
                    <TabsTrigger 
                        value="month"
                        className="text-sm sm:text-base data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md sm:rounded-lg transition-all"
                    >
                        This Month
                    </TabsTrigger>
                    <TabsTrigger 
                        value="year"
                        className="text-sm sm:text-base data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md sm:rounded-lg transition-all"
                    >
                        This Year
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="w-full overflow-hidden bg-white rounded-lg sm:rounded-xl shadow-sm border border-orange-100">
                {paginatedData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-3 sm:px-4">
                        <div className="bg-orange-50 rounded-full p-2 sm:p-3 mb-3 sm:mb-4">
                            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                        </div>
                        <p className="text-sm sm:text-base text-gray-500 text-center">
                            No exercise history found for the selected time frame.
                            Add some sets to the exercise to see the history.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="hidden lg:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-orange-50 hover:bg-orange-50/80">
                                        <TableHead className="text-orange-700">Date</TableHead>
                                        <TableHead className="text-orange-700">Sets</TableHead>
                                        <TableHead className="text-orange-700">Rep Range</TableHead>
                                        <TableHead className="text-orange-700">Achieved Reps</TableHead>
                                        <TableHead className="text-orange-700">Avg Weight (kg)</TableHead>
                                        <TableHead className="text-orange-700">Achievement</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedData.map((row, index) => (
                                        <TableRow 
                                            key={index}
                                            className="hover:bg-orange-50/50 transition-colors"
                                        >
                                            <TableCell className="font-medium">
                                                {new Date(row.date).toLocaleDateString()}
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="ml-2 text-orange-600 hover:text-orange-700 p-0 h-auto"
                                                    onClick={() => {
                                                        const formattedDate = new Date(row.date).toISOString().split('T')[0];
                                                        window.location.href = `${window.location.pathname}/report?date=${formattedDate}`;
                                                    }}
                                                >
                                                    View Report
                                                </Button>
                                            </TableCell>
                                            <TableCell>{row.totalSets}</TableCell>
                                            <TableCell>{row.repRange}</TableCell>
                                            <TableCell>{row.achievedReps}</TableCell>
                                            <TableCell>{row.avgWeight}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full max-w-[100px] h-2 bg-orange-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-orange-500 rounded-full"
                                                            style={{ width: `${Math.min(row.achievementRate, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-600">
                                                        {row.achievementRate}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="lg:hidden space-y-3 sm:space-y-4 p-3 sm:p-4">
                            {paginatedData.map((row, index) => (
                                <div 
                                    key={index} 
                                    className="bg-white rounded-lg sm:rounded-xl border border-orange-100 overflow-hidden hover:border-orange-200 transition-all duration-200"
                                >
                                    <div className="bg-orange-50/50 px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center border-b border-orange-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base sm:text-lg font-semibold text-gray-900">
                                                {new Date(row.date).toLocaleDateString()}
                                            </span>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="text-orange-600 hover:text-orange-700 p-0 h-auto"
                                                onClick={() => {
                                                    const formattedDate = new Date(row.date).toISOString().split('T')[0];
                                                    window.location.href = `${window.location.pathname}/report?date=${formattedDate}`;
                                                }}
                                            >
                                                View Report
                                            </Button>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="px-2.5 sm:px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-medium">
                                                {row.totalSets} sets
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            <div className="space-y-0.5 sm:space-y-1">
                                                <span className="text-xs sm:text-sm text-gray-500">Target Range</span>
                                                <p className="text-sm sm:text-base font-medium text-gray-900">
                                                    {row.repRange} reps
                                                </p>
                                            </div>
                                            <div className="space-y-0.5 sm:space-y-1">
                                                <span className="text-xs sm:text-sm text-gray-500">Achieved</span>
                                                <p className="text-sm sm:text-base font-medium text-gray-900">
                                                    {row.achievedReps} reps
                                                </p>
                                            </div>
                                            <div className="space-y-0.5 sm:space-y-1">
                                                <span className="text-xs sm:text-sm text-gray-500">Average Weight</span>
                                                <p className="text-sm sm:text-base font-medium text-gray-900">
                                                    {row.avgWeight} kg
                                                </p>
                                            </div>
                                            <div className="space-y-0.5 sm:space-y-1">
                                                <span className="text-xs sm:text-sm text-gray-500">Achievement Rate</span>
                                                <p className="text-sm sm:text-base font-medium text-gray-900">
                                                    {row.achievementRate}%
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-1 sm:pt-2">
                                            <div className="h-1.5 sm:h-2 bg-orange-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${Math.min(row.achievementRate, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-100 bg-white">
                            <Button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-sm h-8 sm:h-9"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
                                Previous
                            </Button>
                            <span className="text-xs sm:text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-sm h-8 sm:h-9"
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}