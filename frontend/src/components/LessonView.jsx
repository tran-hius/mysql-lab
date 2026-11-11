import { useState } from 'react'
import ExercisePanel from './ExercisePanel.jsx'
import LessonContent from './LessonContent.jsx'
import LessonResults from './LessonResults.jsx'
import NotesPanel from './NotesPanel.jsx'
import QuizPanel from './QuizPanel.jsx'

const TABS = [
  { id: 'learn', label: 'Học' },
  { id: 'do', label: 'Làm bài' },
  { id: 'result', label: 'Kết quả' },
]

export default function LessonView({
  module,
  lesson,
  progress,
  course,
  onGraded,
  onNext,
  hasNext,
  play,
}) {
  const [tab, setTab] = useState('learn')

  return (
    <article className="lesson-view">
      <header className="lesson-head">
        <p className="eyebrow">{module.title}</p>
        <h2>{lesson.title}</h2>
        <p className="lesson-goal">{lesson.goal}</p>
      </header>

      <div className="lesson-tabs" role="tablist" aria-label="Khu vực của bài học">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`lesson-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`lesson-panel-${item.id}`}
            className="lesson-tab"
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'learn' && (
        <div
          className="learn-grid"
          role="tabpanel"
          id="lesson-panel-learn"
          aria-labelledby="lesson-tab-learn"
        >
          <LessonContent blocks={lesson.blocks} />
          <NotesPanel key={lesson.id} lessonId={lesson.id} course={course} />
        </div>
      )}

      {tab === 'do' && (
        <div role="tabpanel" id="lesson-panel-do" aria-labelledby="lesson-tab-do">
          {lesson.exercises.map((exercise) =>
            exercise.type === 'quiz' ? (
              <QuizPanel
                key={exercise.id}
                exercise={exercise}
                progressEntry={progress.exercises[exercise.id]}
                onGraded={onGraded}
                play={play}
              />
            ) : (
              <ExercisePanel
                key={exercise.id}
                exercise={exercise}
                progressEntry={progress.exercises[exercise.id]}
                onGraded={onGraded}
                play={play}
              />
            ),
          )}
        </div>
      )}

      {tab === 'result' && (
        <div role="tabpanel" id="lesson-panel-result" aria-labelledby="lesson-tab-result">
          <LessonResults
            lesson={lesson}
            progress={progress}
            onNext={onNext}
            hasNext={hasNext}
          />
        </div>
      )}
    </article>
  )
}
