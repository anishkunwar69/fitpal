"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  BarChart,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type MuscleGroup = {
  id: number;
  name: string;
};

type Exercise = {
  id: number;
  name: string;
  notes?: string;
  targetSets: number;
  minReps: number;
  maxReps: number;
  unit: "KG" | "LBS";
  muscleGroups: MuscleGroup[];
};

type WorkoutProgram = {
  id: number;
  name: string;
  muscleGroups: MuscleGroup[];
};

const updateExerciseSchema = z.object({
  exerciseId: z.number().positive("Invalid exercise ID"),
  newExerciseName: z
    .string()
    .min(1, "Exercise name is required")
    .max(30, "Exercise name cannot exceed 30 characters"),
});

type UpdateExerciseSchema = z.infer<typeof updateExerciseSchema>;

const EmptyState = ({ workoutId }: { workoutId: string }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="bg-orange-50 rounded-full p-6 mb-6">
      <svg
        className="w-12 h-12 text-orange-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">No exercises yet</h3>
    <p className="text-gray-600 mb-6 max-w-sm">
      Start building your workout by adding exercises for each muscle group
    </p>
    <Link
      href={`/dashboard/workout-programs/${workoutId}/add`}
      className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
    >
      Add Your First Exercise
    </Link>
  </div>
);

const ExerciseCard = ({
  exercise,
  workoutId,
}: {
  exercise: Exercise;
  workoutId: string;
}) => {
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(exercise.name);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setNewName(exercise.name);
  }, [exercise.name]);

  const { mutate: deleteExercise, isPending } = useMutation({
    mutationFn: async (exerciseId: number) => {
      const response = await fetch("/api/v1/exercises/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exerciseId }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Exercise deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      setShowDeleteModal(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete exercise");
      setShowDeleteModal(false);
    },
  });

  const { mutate: renameExercise, isPending: isRenaming } = useMutation({
    mutationFn: async (data: {
      exerciseId: number;
      newExerciseName: string;
    }) => {
      const response = await fetch("/api/v1/exercises/rename", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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
      toast.success("Exercise renamed successfully");
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      setIsEditing(false);
      setShowUpdateModal(false);
      setValidationError(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to rename exercise");
      setShowUpdateModal(false);
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    deleteExercise(exercise.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEditing(true);
    setValidationError(null);
  };

  const handleUpdateClick = (e: React.MouseEvent) => {
    e.preventDefault();

    const validationResult = updateExerciseSchema.safeParse({
      exerciseId: exercise.id,
      newExerciseName: newName,
    });

    if (!validationResult.success) {
      setValidationError(
        validationResult.error.errors[0]?.message || "Invalid input"
      );
      return;
    }

    if (newName !== exercise.name) {
      setShowUpdateModal(true);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    setValidationError(null);
  };

  const handleConfirmUpdate = () => {
    const validationResult = updateExerciseSchema.safeParse({
      exerciseId: exercise.id,
      newExerciseName: newName.trim(),
    });

    if (!validationResult.success) {
      setValidationError(validationResult.error.errors[0]?.message);
      setShowUpdateModal(false);
      return;
    }

    renameExercise(validationResult.data);
  };

  return (
    <>
      <div className="p-6 rounded-xl border border-orange-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
        {isEditing ? (
          <div className="flex-1 space-y-4 w-full">
            <div className="flex items-center justify-between w-full gap-2">
              <input
                type="text"
                value={newName}
                onChange={handleNameChange}
                className={`w-full text-base sm:text-lg font-semibold text-gray-900 border-b px-1 py-0.5 ${
                  validationError
                    ? "border-red-300 focus:border-red-500"
                    : "border-orange-200 focus:border-orange-500"
                } focus:outline-none bg-transparent`}
                autoFocus
              />
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex-shrink-0"
                title="Delete exercise"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {validationError && (
              <p className="text-xs text-red-500 mt-1">{validationError}</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNewName(exercise.name);
                  setValidationError(null);
                }}
                className="w-full px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateClick}
                disabled={newName === exercise.name}
                className={`w-full px-4 py-2 rounded-lg text-sm ${
                  newName === exercise.name
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                } transition-colors`}
              >
                Update
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {exercise.name}
              </h3>
              <button
                onClick={handleEditClick}
                className="p-1 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors"
                title="Edit exercise name"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Delete exercise"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <div className="bg-orange-50 px-4 py-2 rounded-lg">
            <span className="text-orange-600 font-medium">
              {exercise.targetSets}
            </span>
            <span className="text-gray-600 ml-1">sets</span>
          </div>
          <div className="bg-orange-50 px-4 py-2 rounded-lg">
            <span className="text-orange-600 font-medium">
              {exercise.minReps}-{exercise.maxReps}
            </span>
            <span className="text-gray-600 ml-1">reps</span>
          </div>
          <div className="bg-orange-50 px-4 py-2 rounded-lg">
            <span className="text-orange-600 font-medium">{exercise.unit}</span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg h-[80px] overflow-y-auto">
          <p className="text-sm text-gray-600 leading-relaxed">
            {exercise.notes || "No notes available"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {exercise.muscleGroups.map((muscle) => (
            <span
              key={muscle.id}
              className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium"
            >
              {muscle.name}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Link
            href={`/dashboard/workout-programs/${workoutId}/exercise/${exercise.id}`}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Sets
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>

          <Link
            href={`/dashboard/workout-programs/${workoutId}/exercise/${exercise.id}/history`}
            className="px-6 py-2.5 bg-white border border-orange-200 hover:bg-orange-50 text-orange-600 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            History
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-6 py-2.5 bg-white border border-orange-200 hover:bg-orange-50 text-orange-600 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                <BarChart className="w-4 h-4" />
                Analytics
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/workout-programs/${workoutId}/exercise/${exercise.id}/analytics/week`}
                >
                  This Week
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/workout-programs/${workoutId}/exercise/${exercise.id}/analytics/month`}
                >
                  This Month
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/workout-programs/${workoutId}/exercise/${exercise.id}/analytics/year`}
                >
                  This Year
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog.Root open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[400px] rounded-xl bg-white p-6 shadow-lg animate-scale-in">
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-3">
              Confirm Update
            </Dialog.Title>
            <Dialog.Description className="text-gray-600 mb-6">
              Are you sure you want to rename this exercise from "
              {exercise.name}" to "{newName}"?
            </Dialog.Description>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpdate}
                disabled={isRenaming}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isRenaming ? (
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

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isPending}
      />
    </>
  );
};

const ErrorState = ({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) => (
  <div className="min-h-[68vh] flex items-center justify-center p-4">
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md w-full">
      <div className="bg-red-50 rounded-full p-6 mb-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Failed to Load Exercise Data
      </h3>
      <p className="text-gray-600 mb-6">
        {error.message || "Something went wrong while fetching exercises"}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <RefreshCcw className="w-4 h-4 mr-2" />
        Try Again
      </button>
    </div>
  </div>
);

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
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
          Are you sure you want to delete this exercise? This action cannot be
          undone.
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
);

export default function ExercisesPage() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeMuscleGroupId, setActiveMuscleGroupId] = useState<number | null>(
    null
  );

  const {
    data: workout,
    isLoading: isWorkoutLoading,
    isError: isWorkoutError,
    error: workoutError,
    refetch: refetchWorkout,
  } = useQuery<WorkoutProgram>({
    queryKey: ["workout", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/workout-program/${params.id}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch workout program");
      }
      return data.data;
    },
    retry: 2,
  });

  const {
    data: exercises,
    isLoading: isExercisesLoading,
    isError: isExercisesError,
    error: exercisesError,
    refetch: refetchExercises,
  } = useQuery({
    queryKey: ["exercises", params.id, activeMuscleGroupId, "list"],
    queryFn: async () => {
      if (!activeMuscleGroupId) return [];
      const res = await fetch(
        `/api/v1/exercises/${workout?.id}/${activeMuscleGroupId}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch exercises");
      }
      return data.data;
    },
    enabled: !!activeMuscleGroupId,
    retry: 2,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (activeMuscleGroupId) {
      refetchExercises();
    }
  }, [activeMuscleGroupId, refetchExercises]);

  useEffect(() => {
    if (workout && workout.muscleGroups && workout.muscleGroups.length > 0) {
      const firstMuscleGroup = workout.muscleGroups[0];
      setActiveTab(firstMuscleGroup.name);
      setActiveMuscleGroupId(firstMuscleGroup.id);
    }
  }, [workout]);

  if (isWorkoutLoading) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full  rounded-xl p-6 text-center">
          <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Loading workout program
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch your workout details
          </p>
        </div>
      </div>
    );
  }

  if (isWorkoutError || !workout) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to load workout program
          </h2>
          <p className="text-gray-600 mb-6">
            {workoutError?.message ||
              "There was an error loading your workout program"}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => refetchWorkout()}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/dashboard/workout-programs"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isExercisesError) {
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

        <ErrorState
          error={exercisesError as Error}
          onRetry={() => refetchExercises()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <button
          onClick={() => router.push("/dashboard/workout-programs")}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-orange-100 text-gray-600 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Exercises for</h1>
          <p className="mt-1 text-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            {workout.name}
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-8">
        <nav
          className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide"
          aria-label="Tabs"
        >
          {workout.muscleGroups.map((muscleGroup) => (
            <button
              key={muscleGroup.id}
              onClick={() => {
                setActiveTab(muscleGroup.name);
                setActiveMuscleGroupId(muscleGroup.id);
              }}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === muscleGroup.name
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {muscleGroup.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="relative min-h-[400px]">
        {isExercisesLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : exercises?.length === 0 ? (
          <EmptyState workoutId={workout.id.toString()} />
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <Link
                href={`/dashboard/workout-programs/${workout.id}/add`}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Exercise
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {exercises?.map((exercise: any) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  workoutId={workout.id.toString()}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
