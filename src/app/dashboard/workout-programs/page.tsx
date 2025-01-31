"use client";
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Calendar, ChevronRight, Loader2, Pencil, Plus, RefreshCcw, Target, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useEffect, useMemo, useState } from 'react';
import { toast, Toaster } from "sonner";
import { z } from "zod";

const LoadingSpinner = memo(() => (
  <div className="min-h-[90vh] flex items-center justify-center p-4">
  <div className="max-w-md w-full  rounded-xl p-6 text-center">
    <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
    <h2 className="text-xl font-bold text-gray-900 mb-2">
      Loading workout program
    </h2>
    <p className="text-gray-600">
      Please wait while we fetch your workout programs
    </p>
  </div>
</div>
));

const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-[90vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to load workout program
          </h2>
          <p className="text-gray-600 mb-6">
            {"There was an error loading your workout program"}
          </p>
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
));

const EmptyState = memo(() => (
  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 sm:p-8 text-center">
    <div className="bg-white w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center shadow-sm">
      <Target className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
    </div>
    <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-gray-900">No workout programs yet</h3>
    <p className="mt-1 sm:mt-2 text-sm text-gray-600">Create your first workout program to get started</p>
    <Link
      href="/workout-program/add"
      className="mt-3 sm:mt-4 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto"
    >
      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
      Create Workout Program
    </Link>
  </div>
));

const DeleteConfirmationDialog = memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  isDeleting: boolean;
}) => (
  <Dialog.Root open={isOpen} onOpenChange={onClose}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[400px] rounded-xl bg-white p-6 shadow-lg animate-scale-in">
        <Dialog.Title className="text-xl font-semibold text-gray-900 mb-3">
          Confirm Deletion
        </Dialog.Title>
        <Dialog.Description className="text-gray-600 mb-6">
          Are you sure you want to delete this workout program? This action cannot be undone.
        </Dialog.Description>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
));

DeleteConfirmationDialog.displayName = 'DeleteConfirmationDialog';

const UpdateConfirmationDialog = memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isUpdating,
  oldName,
  newName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  isUpdating: boolean;
  oldName: string;
  newName: string;
}) => (
  <Dialog.Root open={isOpen} onOpenChange={onClose}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[400px] rounded-xl bg-white p-6 shadow-lg animate-scale-in">
        <Dialog.Title className="text-xl font-semibold text-gray-900 mb-3">
          Confirm Update
        </Dialog.Title>
        <Dialog.Description className="text-gray-600 mb-6">
          Are you sure you want to rename this workout program from "{oldName}" to "{newName}"?
        </Dialog.Description>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Name"
            )}
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
));

UpdateConfirmationDialog.displayName = 'UpdateConfirmationDialog';
const updateWorkoutProgramSchema = z.object({
  newWorkoutProgramName: z.string().min(1, "Workout program name is required").max(30, "Workout program name is too long"),
  workoutProgramId: z.number().positive("Invalid workout program ID"),
});

type UpdateWorkoutProgramSchema = z.infer<typeof updateWorkoutProgramSchema>;

const WorkoutCard = memo(({ workout }: { workout: any }) => {
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(workout.name);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isWorkoutForToday = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    return workout.workoutDays.includes(today);
  }, [workout.workoutDays]);

  useEffect(() => {
    setNewName(workout.name);
  }, [workout.name]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setValidationError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setNewName(e.target.value);
    setValidationError(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(false);
    setNewName(workout.name);
    setValidationError(null);
  };

  const { mutate: deleteWorkout, isPending } = useMutation({
    mutationFn: async (workoutProgramId: number) => {
      const response = await fetch('/api/v1/workout-program/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workoutProgramId }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Workout program deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      setShowDeleteModal(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete workout program');
      setShowDeleteModal(false);
    },
  });

  const { mutate: renameWorkout, isPending: isRenaming } = useMutation({
    mutationFn: async (data: UpdateWorkoutProgramSchema) => {
      const response = await fetch('/api/v1/workout-program/rename', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      toast.success('Workout program renamed successfully', {
        style: { width: '400px', maxWidth: '90vw' }
      });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      setIsEditing(false);
      setShowUpdateModal(false);
      setValidationError(null);
    },
    onError: (error: Error) => {
      console.log(error.message)
      toast.error(error.message || 'Failed to rename workout program', {
        style: { width: '400px', maxWidth: '90vw' }
      });
      setShowUpdateModal(false);
    },
  });

  const handleUpdateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const validationResult = updateWorkoutProgramSchema.safeParse({
      newWorkoutProgramName: newName,
      workoutProgramId: workout.id
    });

    if (!validationResult.success) {
      setValidationError(validationResult.error.errors[0]?.message || "Invalid input");
      return;
    }

    setValidationError(null);
    if (newName !== workout.name) {
      setShowUpdateModal(true);
    }
  };

  const handleConfirmUpdate = () => {
    const validationResult = updateWorkoutProgramSchema.safeParse({
      newWorkoutProgramName: newName,
      workoutProgramId: workout.id
    });

    if (!validationResult.success) {
      setValidationError(validationResult.error.errors[0]?.message || "Invalid input");
      setShowUpdateModal(false);
      return;
    }

    renameWorkout(validationResult.data);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    deleteWorkout(workout.id);
  };

  return (
    <>
      <div 
        className={`
          group relative overflow-hidden bg-white rounded-xl transition-all duration-300 hover:-translate-y-1
          ${isWorkoutForToday 
            ? 'ring-2 ring-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.3)]' 
            : 'shadow-sm hover:shadow-xl'
          }
        `}
      >
        {isWorkoutForToday && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400">
            <div className="absolute -bottom-[2px] left-4 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-orange-400"></div>
          </div>
        )}

        <div className="relative p-3 sm:p-6">
          {isWorkoutForToday && (
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-orange-600">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
              Today's Training
            </div>
          )}
          
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex-1 min-w-0 pr-3 sm:pr-4">
              {isEditing ? (
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex items-center justify-between w-full gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={handleNameChange}
                      className={`w-full text-base sm:text-lg font-semibold text-gray-900 border-b px-1 py-0.5 ${
                        validationError 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-orange-200 focus:border-orange-500'
                      } focus:outline-none bg-transparent`}
                      autoFocus
                    />
                    <button
                      onClick={handleDelete}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex-shrink-0"
                      title="Delete workout program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {validationError && (
                    <p className="text-xs text-red-500 mt-1">
                      {validationError}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="w-full px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateClick}
                      disabled={newName === workout.name}
                      className={`w-full px-4 py-2 rounded-lg text-sm ${
                        newName === workout.name
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      } transition-colors`}
                    >
                      Update
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-xl font-semibold text-gray-900">
                    {workout.name}
                  </h3>
                  <button
                    onClick={handleEditClick}
                    className="p-1 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors"
                    title="Edit workout program name"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
              {workout.description && (
                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mt-1">
                  {workout.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                title="Delete workout program"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <Link
                href={`/dashboard/workout-programs/${workout.id}/add`}
                className="flex-shrink-0 inline-flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Add exercises</span>
              </Link>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-4">
            <div className="flex items-start gap-1.5 sm:gap-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0 mt-0.5 sm:mt-1" />
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {workout.workoutDays.map((day: string) => (
                  <span
                    key={day}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs rounded-full bg-orange-50 text-orange-700 font-medium"
                  >
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-1.5 sm:gap-3">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0 mt-0.5 sm:mt-1" />
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {workout.muscleGroups?.map((muscle: { name: string }) => (
                  <span
                    key={muscle.name}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium"
                  >
                    {muscle.name.charAt(0) + muscle.name.slice(1).toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Link
            href={`/dashboard/workout-programs/${workout.id}/exercises`}
            className="mt-4 sm:mt-6 inline-flex items-center text-xs sm:text-sm text-orange-600 hover:text-orange-700 transition-colors group/link"
          >
            View Details
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 transform group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <UpdateConfirmationDialog
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={handleConfirmUpdate}
        isUpdating={isRenaming}
        oldName={workout.name}
        newName={newName}
      />

      <DeleteConfirmationDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isPending}
      />
    </>
  );
});

WorkoutCard.displayName = 'WorkoutCard';

export default function WorkoutPrograms() {
  const { data: workouts, isLoading, isError, refetch } = useQuery({
    queryKey: ["workouts"],
    queryFn: async () => {
      const res = await fetch("/api/v1/workout-program/all");
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data;
    },
    staleTime: 30000,
  });

  const router = useRouter();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <Toaster position="top-center" richColors />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-orange-100 text-gray-600 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Your Workout Programs</h1>
            <p className="mt-0.5 sm:mt-1 text-sm text-gray-600">Manage and track your fitness routines</p>
          </div>
          <Link
            href="/workout-program/add"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            New Program
          </Link>
        </div>

        {!workouts?.data?.length ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {workouts.data.map((workout: any) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </div>
    </>
  );
} 