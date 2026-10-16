import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Calculator,
  Target,
  Award,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Tabs } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useToast } from '../../ui/Toast';

export interface Evaluation {
  id: string;
  name: string;
  weight: number; // percentage
  grade: number | null; // null if pending
}

export interface Course {
  id: string;
  name: string;
  credits: number;
  evaluations: Evaluation[];
  maxScale: number; // 100, 20, 10, 5
  minPassing: number;
}

export interface SemesterCourse {
  id: string;
  name: string;
  credits: number;
  finalGrade: number;
}

const DEFAULT_COURSES: Course[] = [
  {
    id: 'course-1',
    name: 'Cálculo Diferencial',
    credits: 4,
    maxScale: 100,
    minPassing: 60,
    evaluations: [
      { id: 'ev-1', name: 'Primer Parcial', weight: 25, grade: 78 },
      { id: 'ev-2', name: 'Segundo Parcial', weight: 25, grade: 82 },
      { id: 'ev-3', name: 'Talleres y Tareas', weight: 20, grade: 90 },
      { id: 'ev-4', name: 'Examen Final', weight: 30, grade: null },
    ],
  },
  {
    id: 'course-2',
    name: 'Estructuras de Datos',
    credits: 3,
    maxScale: 20,
    minPassing: 12,
    evaluations: [
      { id: 'ev-21', name: 'Práctica Calificada 1', weight: 30, grade: 16 },
      { id: 'ev-22', name: 'Proyecto de Programación', weight: 35, grade: 17 },
      { id: 'ev-23', name: 'Examen Final', weight: 35, grade: null },
    ],
  },
];

const DEFAULT_SEMESTER_COURSES: SemesterCourse[] = [
  { id: 'sem-1', name: 'Cálculo Diferencial', credits: 4, finalGrade: 82 },
  { id: 'sem-2', name: 'Física I', credits: 4, finalGrade: 75 },
  { id: 'sem-3', name: 'Programación I', credits: 3, finalGrade: 92 },
  { id: 'sem-4', name: 'Inglés Técnico', credits: 2, finalGrade: 88 },
];

export default function GradeCalculator() {
  const [activeTab, setActiveTab] = useState<'course' | 'semester'>('course');
  const [courses, setCourses] = useLocalStorage<Course[]>('app-grade-courses', DEFAULT_COURSES);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [semesterCourses, setSemesterCourses] = useLocalStorage<SemesterCourse[]>(
    'app-grade-semester',
    DEFAULT_SEMESTER_COURSES
  );

  // Target Grade Simulation State
  const [targetGradeInput, setTargetGradeInput] = useState<number | ''>('');
  const [customFinalWeight, setCustomFinalWeight] = useState<number | ''>('');

  const { success, error: toastError } = useToast();

  const currentCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0] || null;
  }, [courses, selectedCourseId]);

  // Course calculations
  const courseStats = useMemo(() => {
    if (!currentCourse) return null;

    const totalWeight = currentCourse.evaluations.reduce((acc, ev) => acc + (ev.weight || 0), 0);
    const completedEvaluations = currentCourse.evaluations.filter(
      (ev) => ev.grade !== null && !isNaN(ev.grade)
    );
    const completedWeight = completedEvaluations.reduce((acc, ev) => acc + (ev.weight || 0), 0);

    const accumulatedPoints = completedEvaluations.reduce((acc, ev) => {
      const g = ev.grade || 0;
      return acc + (g * (ev.weight / 100));
    }, 0);

    const currentAverage =
      completedWeight > 0 ? (accumulatedPoints / (completedWeight / 100)) : 0;

    const pendingWeight = Math.max(0, 100 - completedWeight);

    return {
      totalWeight,
      completedWeight,
      pendingWeight,
      accumulatedPoints: Math.round(accumulatedPoints * 100) / 100,
      currentAverage: Math.round(currentAverage * 100) / 100,
      isWeight100: totalWeight === 100,
    };
  }, [currentCourse]);

  // Target Exam Calculation
  const examNeedResult = useMemo(() => {
    if (!currentCourse || !courseStats) return null;

    const target =
      targetGradeInput === '' ? currentCourse.minPassing : Number(targetGradeInput);
    const weightToUse =
      customFinalWeight === '' ? courseStats.pendingWeight : Number(customFinalWeight);

    if (weightToUse <= 0) {
      return { status: 'none', needed: 0, message: 'No hay porcentaje pendiente por evaluar.' };
    }

    const needed = (target - courseStats.accumulatedPoints) / (weightToUse / 100);
    const rounded = Math.round(needed * 100) / 100;

    if (courseStats.accumulatedPoints >= target) {
      return {
        status: 'passed',
        needed: 0,
        message: `¡Ya alcanzaste tu objetivo! Llevas ${courseStats.accumulatedPoints} acumulados y tu meta era ${target}.`,
      };
    }

    if (rounded > currentCourse.maxScale) {
      return {
        status: 'impossible',
        needed: rounded,
        message: `Requerirías un ${rounded} sobre ${currentCourse.maxScale}, lo cual supera la nota máxima de la escala.`,
      };
    }

    return {
      status: 'possible',
      needed: rounded,
      message: `Necesitas obtener al menos ${rounded} (sobre ${currentCourse.maxScale}) en el ${weightToUse}% pendiente para lograr ${target}.`,
    };
  }, [currentCourse, courseStats, targetGradeInput, customFinalWeight]);

  // Semester GPA Calculation
  const semesterStats = useMemo(() => {
    const totalCredits = semesterCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
    const totalPoints = semesterCourses.reduce(
      (sum, c) => sum + (c.credits || 0) * (c.finalGrade || 0),
      0
    );
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    return {
      totalCredits,
      gpa: Math.round(gpa * 100) / 100,
      coursesCount: semesterCourses.length,
    };
  }, [semesterCourses]);

  // Add course
  const handleAddCourse = () => {
    const newCourse: Course = {
      id: Math.random().toString(36).substring(2, 9),
      name: `Nueva Materia ${courses.length + 1}`,
      credits: 3,
      maxScale: 100,
      minPassing: 60,
      evaluations: [
        { id: 'ev-new-1', name: 'Parcial 1', weight: 40, grade: null },
        { id: 'ev-new-2', name: 'Parcial 2', weight: 60, grade: null },
      ],
    };
    setCourses((prev) => [...prev, newCourse]);
    setSelectedCourseId(newCourse.id);
    success('Materia creada');
  };

  // Duplicate course
  const handleDuplicateCourse = () => {
    if (!currentCourse) return;
    const duplicated: Course = {
      ...currentCourse,
      id: Math.random().toString(36).substring(2, 9),
      name: `${currentCourse.name} (Copia)`,
      evaluations: currentCourse.evaluations.map((ev) => ({
        ...ev,
        id: Math.random().toString(36).substring(2, 9),
      })),
    };
    setCourses((prev) => [...prev, duplicated]);
    setSelectedCourseId(duplicated.id);
    success('Materia duplicada');
  };

  // Delete course
  const handleDeleteCourse = (id: string) => {
    if (courses.length <= 1) {
      toastError('Debes mantener al menos una materia');
      return;
    }
    const remaining = courses.filter((c) => c.id !== id);
    setCourses(remaining);
    setSelectedCourseId(remaining[0].id);
    success('Materia eliminada');
  };

  // Evaluation table edits
  const handleUpdateEvaluation = (
    evId: string,
    field: keyof Evaluation,
    val: any
  ) => {
    if (!currentCourse) return;
    const updated = {
      ...currentCourse,
      evaluations: currentCourse.evaluations.map((ev) => {
        if (ev.id !== evId) return ev;
        return { ...ev, [field]: val };
      }),
    };
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddEvaluation = () => {
    if (!currentCourse) return;
    const newEv: Evaluation = {
      id: Math.random().toString(36).substring(2, 9),
      name: `Evaluación ${currentCourse.evaluations.length + 1}`,
      weight: 10,
      grade: null,
    };
    const updated = {
      ...currentCourse,
      evaluations: [...currentCourse.evaluations, newEv],
    };
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteEvaluation = (evId: string) => {
    if (!currentCourse || currentCourse.evaluations.length <= 1) {
      toastError('La materia debe tener al menos una evaluación');
      return;
    }
    const updated = {
      ...currentCourse,
      evaluations: currentCourse.evaluations.filter((ev) => ev.id !== evId),
    };
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  // Scale change
  const handleScaleChange = (scale: number) => {
    if (!currentCourse) return;
    const passing = scale === 100 ? 60 : scale === 20 ? 12 : scale === 10 ? 6 : 3;
    const updated = {
      ...currentCourse,
      maxScale: scale,
      minPassing: passing,
    };
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  // Export & Import
  const handleExportJson = () => {
    const data = {
      courses,
      semesterCourses,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notas-universitarias.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Datos académicos exportados');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.courses && Array.isArray(parsed.courses)) {
          setCourses(parsed.courses);
          setSelectedCourseId(parsed.courses[0]?.id || '');
        }
        if (parsed.semesterCourses && Array.isArray(parsed.semesterCourses)) {
          setSemesterCourses(parsed.semesterCourses);
        }
        success('Datos académicos importados con éxito');
      } catch {
        toastError('El archivo no contiene un formato JSON válido de notas.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[var(--accent-text)]" />
            Calculadora de Notas y Promedio Ponderado
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Seguimiento de materias universitarias, estimación de examen final y promedio de créditos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tabs
            tabs={[
              { id: 'course', label: 'Por Materia (Evaluaciones)' },
              { id: 'semester', label: 'Promedio General (Créditos)' },
            ]}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as any)}
          />
        </div>
      </div>

      {/* Tab: COURSE EVALUATIONS */}
      {activeTab === 'course' && currentCourse && (
        <div className="space-y-6">
          {/* Courses Tabs & Top Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    c.id === currentCourse.id
                      ? 'bg-[var(--accent-color)] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{c.name}</span>
                </button>
              ))}

              <Button
                size="sm"
                variant="outline"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddCourse}
              >
                Nueva Materia
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={handleDuplicateCourse} title="Duplicar materia">
                Duplicar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-500"
                onClick={() => handleDeleteCourse(currentCourse.id)}
                title="Eliminar materia"
              >
                Eliminar
              </Button>
            </div>
          </div>

          {/* Course Configuration Strip */}
          <Card className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre de la Materia
                </label>
                <input
                  type="text"
                  value={currentCourse.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCourses((prev) =>
                      prev.map((c) => (c.id === currentCourse.id ? { ...c, name: val } : c))
                    );
                  }}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Créditos
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={currentCourse.credits}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value) || 1);
                    setCourses((prev) =>
                      prev.map((c) => (c.id === currentCourse.id ? { ...c, credits: val } : c))
                    );
                  }}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Escala de Calificación
                </label>
                <select
                  value={currentCourse.maxScale}
                  onChange={(e) => handleScaleChange(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold cursor-pointer"
                >
                  <option value={100}>0 a 100 puntos (por defecto)</option>
                  <option value={20}>0 a 20 puntos</option>
                  <option value={10}>0 a 10 puntos</option>
                  <option value={5}>0 a 5.0 puntos</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nota Mínima para Aprobar
                </label>
                <input
                  type="number"
                  step="any"
                  value={currentCourse.minPassing}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setCourses((prev) =>
                      prev.map((c) => (c.id === currentCourse.id ? { ...c, minPassing: val } : c))
                    );
                  }}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>
            </div>
          </Card>

          {/* Main 2-Column: Evaluations Table | Course Summary & Target Solver */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Evaluations Table */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Evaluaciones y Ponderaciones
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={handleAddEvaluation}
                  >
                    Añadir evaluación
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                        <th className="pb-2 font-bold">Actividad / Examen</th>
                        <th className="pb-2 font-bold w-24">Peso (%)</th>
                        <th className="pb-2 font-bold w-28">Nota Obtenida</th>
                        <th className="pb-2 font-bold text-right w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentCourse.evaluations.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 pr-2">
                            <input
                              type="text"
                              value={ev.name}
                              onChange={(e) => handleUpdateEvaluation(ev.id, 'name', e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={ev.weight}
                                onChange={(e) =>
                                  handleUpdateEvaluation(ev.id, 'weight', Number(e.target.value) || 0)
                                }
                                className="w-16 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold"
                              />
                              <span className="text-slate-400">%</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max={currentCourse.maxScale}
                              placeholder="Pendiente"
                              value={ev.grade === null ? '' : ev.grade}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                handleUpdateEvaluation(ev.id, 'grade', val);
                              }}
                              className="w-24 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold font-mono"
                            />
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => handleDeleteEvaluation(ev.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                              title="Eliminar evaluación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Weight sum validation banner */}
                {courseStats && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
                      courseStats.totalWeight === 100
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : courseStats.totalWeight < 100
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {courseStats.totalWeight === 100 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>¡Pesos balanceados perfectamente! Suman 100%.</span>
                      </>
                    ) : courseStats.totalWeight < 100 ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                          Los pesos suman {courseStats.totalWeight}%. Falta un {100 - courseStats.totalWeight}% por asignar.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>
                          ¡Atención! La suma de pesos ({courseStats.totalWeight}%) supera el 100%.
                        </span>
                      </>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Metrics & Final Exam Solver */}
            <div className="lg:col-span-5 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3.5 text-center">
                  <span className="text-xs text-slate-500">Puntos Acumulados</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {courseStats?.accumulatedPoints}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    de {currentCourse.maxScale} posibles
                  </span>
                </Card>

                <Card className="p-3.5 text-center">
                  <span className="text-xs text-slate-500">Promedio Calificado</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {courseStats?.currentAverage}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    Evaluado: {courseStats?.completedWeight}%
                  </span>
                </Card>
              </div>

              {/* "¿Cuánto necesito en el examen final?" */}
              <Card className="p-4 sm:p-5 space-y-4 border-2 border-[var(--accent-border)] bg-[var(--accent-subtle)]/30">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Target className="w-4 h-4 text-[var(--accent-text)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    ¿Cuánto necesito para aprobar o sacar mi meta?
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Nota Objetivo
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder={`Aprobar (${currentCourse.minPassing})`}
                      value={targetGradeInput}
                      onChange={(e) =>
                        setTargetGradeInput(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Peso Pendiente (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder={`Pendiente (${courseStats?.pendingWeight}%)`}
                      value={customFinalWeight}
                      onChange={(e) =>
                        setCustomFinalWeight(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>
                </div>

                {/* Calculation outcome banner */}
                {examNeedResult && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs font-medium space-y-1 ${
                      examNeedResult.status === 'passed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : examNeedResult.status === 'possible'
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-sm">
                      {examNeedResult.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {examNeedResult.status === 'possible' && <Sparkles className="w-4 h-4 text-sky-500" />}
                      {examNeedResult.status === 'impossible' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                      <span>
                        {examNeedResult.status === 'passed'
                          ? '¡Aprobado asegurado!'
                          : examNeedResult.status === 'possible'
                          ? `Nota necesaria: ${examNeedResult.needed}`
                          : 'Meta fuera de alcance'}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-95">{examNeedResult.message}</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Tab: SEMESTER GENERAL GPA */}
      {activeTab === 'semester' && (
        <div className="space-y-6">
          <Card className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[var(--accent-text)]" />
                  Índice Académico Ponderado por Créditos
                </h3>
                <p className="text-xs text-slate-500">
                  Calcula el promedio general del semestre ponderando cada materia por sus unidades de crédito.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const newItem: SemesterCourse = {
                      id: Math.random().toString(36).substring(2, 9),
                      name: `Materia ${semesterCourses.length + 1}`,
                      credits: 3,
                      finalGrade: 80,
                    };
                    setSemesterCourses((prev) => [...prev, newItem]);
                  }}
                >
                  Añadir materia
                </Button>
              </div>
            </div>

            {/* Semester Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="pb-2 font-bold">Materia</th>
                    <th className="pb-2 font-bold w-24">Créditos</th>
                    <th className="pb-2 font-bold w-32">Nota Definitiva</th>
                    <th className="pb-2 font-bold text-right w-24">Puntos</th>
                    <th className="pb-2 font-bold text-right w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {semesterCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 pr-2">
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSemesterCourses((prev) =>
                              prev.map((item) => (item.id === c.id ? { ...item, name: val } : item))
                            );
                          }}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                        />
                      </td>
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={c.credits}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            setSemesterCourses((prev) =>
                              prev.map((item) => (item.id === c.id ? { ...item, credits: val } : item))
                            );
                          }}
                          className="w-16 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold"
                        />
                      </td>
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          step="any"
                          value={c.finalGrade}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setSemesterCourses((prev) =>
                              prev.map((item) =>
                                item.id === c.id ? { ...item, finalGrade: val } : item
                              )
                            );
                          }}
                          className="w-24 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold font-mono"
                        />
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {((c.credits || 0) * (c.finalGrade || 0)).toFixed(1)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => {
                            if (semesterCourses.length <= 1) {
                              toastError('Debes mantener al menos una materia');
                              return;
                            }
                            setSemesterCourses((prev) => prev.filter((item) => item.id !== c.id));
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GPA Summary Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Total materias: <strong>{semesterStats.coursesCount}</strong> • Total créditos:{' '}
                <strong>{semesterStats.totalCredits}</strong>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Promedio General Ponderado:
                </span>
                <span className="text-2xl font-black text-[var(--accent-text)] px-3 py-1 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-border)] font-mono">
                  {semesterStats.gpa}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Persistence Bar: Export / Import JSON */}
      <Card className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-500">
          Tus notas se guardan automáticamente en tu dispositivo. Puedes exportarlas para hacer copias de seguridad.
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportJson}
          >
            Exportar JSON
          </Button>
          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200 px-3 py-1.5 text-xs gap-1.5 min-h-[36px]">
              <Upload className="w-3.5 h-3.5" />
              Importar JSON
            </span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>
      </Card>
    </div>
  );
}
