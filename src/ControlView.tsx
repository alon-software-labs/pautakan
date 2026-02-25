import './App.css';
import { DragEvent, useEffect, useState } from 'react';
import { College } from './types';

const rankLabels = ['1st', '2nd', '3rd', '4th', '5th'] as const;

function getRankLabelForIndex(index: number): string {
  return rankLabels[index] ?? '1st';
}

function getRankNumericValue(rank: string): number {
  switch (rank) {
    case '1st':
      return 1;
    case '2nd':
      return 2;
    case '3rd':
      return 3;
    case '4th':
      return 4;
    case '5th':
      return 5;
    default:
      return 999;
  }
}

const buttonStyles =
  'inline-flex items-center justify-center rounded border border-gray-400 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50';
export default function ControlView() {
  const [colleges, setColleges] = useState<College[]>([]);
  // Clincher selection mode UI has been simplified away.
  const [, setInCollegeSelectionMode] = useState(false);
  const [difficulty, setDifficulty] = useState('Easy');
  const [category, setCategory] = useState('Eliminations');
  const [division, setDivision] = useState('Teams');
  const [displayedColleges, setDisplayedColleges] = useState<College[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [inClincherRound, setInClincherRound] = useState(false);
  // Add state for tracking college rankings (collegeId -> rank string like "1st")
  const [collegeRankings, setCollegeRankings] = useState<{ [key: string]: string }>({});
  // Add state to track selected colleges (used for clincher / Finals selection)
  const [selectedColleges, setSelectedColleges] = useState<{ [key: string]: boolean }>({});
  // Error message for leaderboard validation
  const [leaderboardError, setLeaderboardError] = useState('');
  // Add state for category errors
  const [categoryError, setCategoryError] = useState('');
  
  const handleCollegeDragStart = (event: DragEvent<HTMLDivElement>, collegeId: string) => {
    event.dataTransfer.setData('text/plain', collegeId);
    // Use move effect so browsers show a drag indicator instead of copy.
    event.dataTransfer.effectAllowed = 'move';
  };

  // College selection for clincher / Finals flows is currently not surfaced in the UI.

  // Load colleges - fetch fresh data from main process
  const fetchColleges = async () => {
    const allColleges = await window.ipcRenderer.invoke('get-colleges');
    setColleges(allColleges);
    return allColleges;
  };

  // Load colleges initially
  useEffect(() => {
    console.log('Getting colleges...');
    fetchColleges().then((allColleges) => {
      setDisplayedColleges(allColleges);
    });
  }, []);

  // Function to check if we're in Eliminations mode and scores are all 0
  const checkAndUpdateDisplayedColleges = async () => {
    if (category === 'Eliminations') {
      const allColleges = await fetchColleges();
      setDisplayedColleges(allColleges);
      console.log('Refreshed college list in Eliminations mode');
    }
  };


  const handleBarDrop = (targetRankIndex: number, collegeId: string) => {
    const rankLabel = getRankLabelForIndex(targetRankIndex);

    setCollegeRankings((current) => {
      const next: { [key: string]: string } = { ...current };

      // Remove any previous rank assignment for this college.
      delete next[collegeId];

      // Ensure only one college occupies this rank.
      Object.keys(next).forEach((id) => {
        if (next[id] === rankLabel) {
          delete next[id];
        }
      });

      next[collegeId] = rankLabel;
      return next;
    });
  };

  // Function to validate leaderboard requirements based on ranked colleges
  function validateLeaderboardRequirements() {
    const rankedCollegeIds = Object.keys(collegeRankings);

    // Consider only ranked colleges that are currently displayed.
    const displayedRankedIds = displayedColleges
      .map((college) => String(college.id))
      .filter((id) => rankedCollegeIds.includes(id));

    // Check if we have the required number of colleges
    const requiredCount = category === 'Finals' ? 3 : 5;
    if (displayedRankedIds.length !== requiredCount) {
      return `You must place exactly ${requiredCount} colleges into the leaderboard bars for ${category} mode.`;
    }

    // Check if all required ranks are used
    const maxRank = category === 'Finals' ? 3 : 5;
    const usedRanks = new Set<string>();

    // Collect all used ranks from currently displayed and ranked colleges
    displayedRankedIds.forEach((id) => {
      const rank = collegeRankings[id];
      if (rank) usedRanks.add(rank);
    });

    for (let i = 1; i <= maxRank; i++) {
      const rankValue =
        i === 1
          ? '1st'
          : i === 2
          ? '2nd'
          : i === 3
          ? '3rd'
          : i === 4
          ? '4th'
          : '5th';
      if (!usedRanks.has(rankValue)) {
        return `Rank "${rankValue}" must be assigned to a college.`;
      }
    }

    if (usedRanks.size !== maxRank) {
      return `All ranks from 1st to ${
        maxRank === 3 ? '3rd' : '5th'
      } must be used exactly once.`;
    }

    return ''; // No error
  }

  const toggleLeaderboard = async () => {
  if (showLeaderboard) {

    setShowLeaderboard(false);
    setLeaderboardError('');
    await window.ipcRenderer.invoke('close-top-five');
    console.log('Leaderboard closed.');
  } else {
    
    // Validate leaderboard requirements
    const error = validateLeaderboardRequirements();
    
    if (error) {
      setLeaderboardError(error);
      alert(error);
      return;
    }
    
    // Clear any previous errors
    setLeaderboardError('');

    // Only use colleges that are currently displayed and have a rank assigned
    const rankedColleges = displayedColleges.filter((college) => {
      const id = String(college.id);
      return Boolean(collegeRankings[id]);
    });

    // Sort by their manual rankings
    const sortedSelectedColleges = [...rankedColleges].sort((a, b) => {
      const rankA = collegeRankings[String(a.id)] || '';
      const rankB = collegeRankings[String(b.id)] || '';

      return getRankNumericValue(rankA) - getRankNumericValue(rankB);
    });
    
    setShowLeaderboard(true);
    
    console.log('Showing leaderboard for:', sortedSelectedColleges);
    
    if (category !== 'Finals') {
      await window.ipcRenderer.invoke('show-top-five', sortedSelectedColleges);
    } else {
      await window.ipcRenderer.invoke('show-top-three', sortedSelectedColleges);
    }
    
    // Log in the control view console
    console.log('DISPLAYING LEADERBOARD:');
    sortedSelectedColleges.forEach((college) => {
      const rank = collegeRankings[String(college.id)];
      console.log(`${rank}: ${college.shorthand} (${college.name})`);
    });
  }
};

// Inside the useEffect hook that watches for category changes
useEffect(() => {
  const changeCategory = async () => {    
    // clear college selection mode
    setInCollegeSelectionMode(false);

    // Special handling for Finals mode
    if (category === 'Finals') {
      // Get the latest data from main process
      const allColleges = await fetchColleges();

      // remove rankings for all colleges
      setCollegeRankings({});

      // Validate we have at least one college selected
      const selectedCollegeIds = Object.keys(selectedColleges).filter(id => selectedColleges[id]);
      
      if (selectedCollegeIds.length === 0) {
        setCategoryError('You must select colleges using the checkboxes before switching to Finals mode.');
        setCategory('Eliminations');
        
        // Show all colleges in Eliminations mode
        setDisplayedColleges(allColleges);
        console.log('Switched back to Eliminations mode - no colleges selected for Finals');
        return;
      }
      
      // Get the selected colleges
      const selectedCollegesList = allColleges.filter((college: College) => 
        selectedCollegeIds.includes(String(college.id))
      );
      
      // Reset scores to 0 for selected colleges when switching to Finals
      const resetCollegesList = selectedCollegesList.map((college: College) => ({
        ...college,
        score: 0
      }));
      
      // Update both college arrays with reset scores
      setColleges(
        colleges.map((college: College) => 
          selectedCollegeIds.includes(String(college.id)) 
          ? { ...college, score: 0 } 
          : college
        )
      );

      // clear selected colleges (important to do this after getting the selected colleges)
      // this clears the checkboxes in the UI
      setSelectedColleges({});
      
      // Use the selected colleges with reset scores for Finals
      setDisplayedColleges(resetCollegesList);
      
      console.log(`Switched to Finals mode with selected colleges, scores reset to 0:`, 
        resetCollegesList.map((c: College) => c.shorthand).join(', '));
      
      await window.ipcRenderer.invoke('sync-category', 'Finals', resetCollegesList);
      
      return;
    }
    
    // For Eliminations mode - show all colleges
    if (category === 'Eliminations') {
      await window.ipcRenderer.invoke('sync-category', 'Eliminations');
      const allColleges = await fetchColleges();

      // Clear any category errors
      setCategoryError('');
      
      // IMPORTANT: Clear all selections when switching back to Eliminations
      setSelectedColleges({});
      setCollegeRankings({});
      
      // Show all colleges - this is critical to display all 16 original colleges
      setDisplayedColleges(allColleges);
      console.log(`Switched to ${category} mode, showing all colleges and cleared all selections`);
      
      // Notify the main process about category change
      await window.ipcRenderer.invoke('sync-category', category);
    }
  };
  
  changeCategory();
}, [category]);

  useEffect(() => {
    const changeDifficulty = async () => {
      await window.ipcRenderer.invoke('sync-difficulty', difficulty);
      console.log(`Difficulty changed to: ${difficulty}`);
    };
    changeDifficulty();
  }, [difficulty]);

  useEffect(() => {
    const changeDivision = async () => {
      await window.ipcRenderer.invoke('sync-division', division);
      console.log(`Division changed to: ${division}`);
    };
    changeDivision();
  }, [division]);

  // Update colleges on change
  // ...then sync to DB
  async function updateScore(
    college: College,
    offset: number,
    adjustRadius: boolean = false
  ) {
    let newScore = college.score + offset;
    if (newScore < 0) newScore = 0; // Prevent negative scores
    const collegeUpdated = { ...college, score: newScore };

    // Update in both colleges arrays
    setColleges(
      colleges.map((x: College) =>
        x.name === collegeUpdated.name ? collegeUpdated : x
      )
    );

    setDisplayedColleges(
      displayedColleges.map((x: College) =>
        x.name === collegeUpdated.name ? collegeUpdated : x
      )
    );

    await window.ipcRenderer.invoke(
      'update-college-score',
      collegeUpdated.shorthand,
      collegeUpdated.score,
      adjustRadius
    );
  }

  // Confirmation handlers
  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleRefreshClick = () => {
    setShowRefreshConfirm(true);
  };

  const handleConfirmReset = () => {
    setShowResetConfirm(false);
    performResetScores();
  };

  const handleConfirmRefresh = () => {
    setShowRefreshConfirm(false);
    performRefresh();
  };

  const handleCancelDialog = () => {
    setShowResetConfirm(false);
    setShowRefreshConfirm(false);
  };

  async function performResetScores() {
    // Reset scores in both college arrays
    setColleges(colleges.map((x: College) => ({ ...x, score: 0 })));
    setDisplayedColleges(
      displayedColleges.map((x: College) => ({ ...x, score: 0 }))
    );
    await window.ipcRenderer.invoke('reset-scores');
  
    // Always fetch and display all colleges after resetting scores
    const allColleges = await fetchColleges();
    setDisplayedColleges(allColleges);
    console.log('Scores reset, refreshed college list');
  
    // If we're in clincher mode, exit it
    if (inClincherRound) {
      setInClincherRound(false);
      console.log('Exited Clincher round due to score reset');
    }
  
    // If we're in Eliminations mode, make sure to sync the category to ensure
    // all processing is complete
    if (category === 'Eliminations') {
      await window.ipcRenderer.invoke('sync-category', 'Eliminations');
    }
    
    // Close leaderboard when scores are reset
    if (showLeaderboard) {
      setShowLeaderboard(false);
      await window.ipcRenderer.invoke('close-top-five');
    }
    
    // Explicitly clear all selections and rankings
    setCollegeRankings({});
    setSelectedColleges({});
    console.log('Cleared all college selections and rankings');
  }
  
  async function performRefresh() {
    // Get fresh data
    const allColleges = await fetchColleges();
    
    // Always display all colleges after refresh
    setDisplayedColleges(allColleges);

    await window.ipcRenderer.invoke('refresh');
    console.log('Application refreshed');
  }

  // Clincher selection helpers are currently unused by the simplified UI.

  // Modified handleSwitchToClincher function to accept a difficulty parameter
  async function handleSwitchToClincher(selectedDifficulty = 'Clincher') {
    // Set difficulty to the selected value
    setDifficulty(selectedDifficulty);
    
    // Enable college selection mode
    setInCollegeSelectionMode(true);
    
    // Clear previous selections
    setSelectedColleges({});
    
    // Refresh the college list to show all colleges
    const allColleges = await fetchColleges();
    setDisplayedColleges(allColleges);
    
    console.log(`Entered college selection mode for ${selectedDifficulty} round`);
  }
  
  async function exitClincherRound(difficulty = 'Easy') {
    setInClincherRound(false);
    setInCollegeSelectionMode(false);
    
    // Refresh the college list
    const allColleges = await fetchColleges();
    setDisplayedColleges(allColleges);
    
    // Reset difficulty (without clincher colleges)
    setDifficulty(difficulty);
    await window.ipcRenderer.invoke('sync-difficulty', difficulty);
    
    console.log('Exited Clincher round, returned to normal mode');
  }

  // Set up listener for scores-reset event from main process
  useEffect(() => {
    const handleScoresReset = async () => {
      console.log('Scores reset event received');
      // Get fresh data and refresh display
      await checkAndUpdateDisplayedColleges();
    };

    // Add event listener
    window.ipcRenderer.on('scores-reset', handleScoresReset);

    // Clean up listener on component unmount
    return () => {
      window.ipcRenderer.removeAllListeners('scores-reset');
    };
  }, [category]); // Re-apply when category changes

  const maxPreviewRank = category === 'Finals' ? 3 : 5;

  return (
    <div
      className="flex w-full bg-white text-gray-900"
      style={{ height: '100vh', overflowY: 'auto' }}
    >
      <div className="min-h-screen w-full">
      {/* Confirmation Dialog for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="relative z-10 max-w-md rounded border border-gray-300 bg-white p-6 shadow-lg">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-gray-900">
              Reset all scores?
            </h2>
            <p className="mb-6 text-sm text-gray-700">
              This will set every college score back to 0 and clear selections and rankings.
            </p>
            <div className="flex justify-end gap-3 text-sm">
              <button
                className="rounded border border-gray-400 bg-white px-4 py-2 font-medium text-gray-800 hover:bg-gray-100"
                onClick={handleCancelDialog}
              >
                Cancel
              </button>
              <button
                className="rounded bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
                onClick={handleConfirmReset}
              >
                Yes, reset scores
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Refresh */}
      {showRefreshConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="relative z-10 max-w-md rounded border border-gray-300 bg-white p-6 shadow-lg">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-gray-900">
              Refresh application?
            </h2>
            <p className="mb-6 text-sm text-gray-700">
              The control view and display will be refreshed using the latest data from the main
              process.
            </p>
            <div className="flex justify-end gap-3 text-sm">
              <button
                className="rounded border border-gray-400 bg-white px-4 py-2 font-medium text-gray-800 hover:bg-gray-100"
                onClick={handleCancelDialog}
              >
                Cancel
              </button>
              <button
                className="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
                onClick={handleConfirmRefresh}
              >
                Yes, refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Pautakan 2025
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
            Control View
          </h1>
          <p className="mt-1 text-xs text-gray-600 md:text-sm">
            Manage scores and the live leaderboard for the main display.
          </p>
        </div>
      </header>

      {/* Main layout */}
      <main className="mx-auto flex max-w-6xl gap-6 px-4 py-4">
        {/* Colleges + scores (left pane) */}
        <section className="flex min-h-[320px] min-w-0 flex-[1.7] flex-col rounded border border-gray-300 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-700">
                Colleges
              </p>
              <p className="text-xs text-gray-500">{displayedColleges.length} colleges</p>
            </div>
          </div>

          <div className="space-y-3 border-b border-gray-200 px-4 py-2 text-xs">
            {categoryError && (
              <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700">
                {categoryError}
              </div>
            )}
            {leaderboardError && (
              <div className="rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-800">
                {leaderboardError}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {displayedColleges.map((college: College) => {
              const id = String(college.id);

              return (
                <div
                  key={college.id}
                  className="group flex items-center justify-between gap-3 rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="min-w-0 cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(event) => handleCollegeDragStart(event, id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex shrink-0 items-center rounded border border-gray-300 bg-gray-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-gray-700">
                          {college.shorthand}
                        </span>
                        <h2 className="truncate text-sm font-semibold text-gray-900">
                          {college.name}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="w-9 text-right font-mono text-sm text-gray-900">
                      {college.score}
                    </span>
                    <ScoreButton
                      college={college}
                      add={false}
                      difficulty={difficulty}
                      updateScore={updateScore}
                    />
                    <ScoreButton
                      college={college}
                      add={true}
                      difficulty={difficulty}
                      updateScore={updateScore}
                    />
                  </div>
                </div>
              );
            })}

            {/* Clincher-specific controls hidden to simplify UI */}
          </div>
        </section>

        {/* Right-side control + leaderboard preview (right pane) */}
        <section className="flex min-w-[260px] max-w-sm flex-1 shrink-0 flex-col gap-4 rounded border border-gray-300 bg-white p-4">
          {/* Mode dropdowns and utility actions */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700">
              Settings
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1 text-xs text-gray-600">
                <span className="uppercase tracking-[0.16em]">Category</span>
                <Dropdown
                  options={[{ value: 'Eliminations' }, { value: 'Finals' }]}
                  preventChange={Object.keys(selectedColleges).length === 0}
                  onChange={(selected) => {
                    if (selected === 'Finals') {
                      const selectedCollegeIds = Object.keys(selectedColleges).filter(
                        (id) => selectedColleges[id]
                      );

                      if (selectedCollegeIds.length === 0) {
                        setCategoryError(
                          'You must select colleges using the checkboxes before switching to Finals mode.'
                        );
                        alert(
                          'You must select colleges using the checkboxes before switching to Finals mode.'
                        );

                        return;
                      }

                      setCategoryError('');
                      setCategory(selected);
                      setDifficulty('Easy');
                    } else if (selected === 'Eliminations') {
                      setCategory(selected);
                      setDifficulty('Easy');
                      setCategoryError('');
                    }
                  }}
                  key={category}
                  initialValue={category}
                />
              </div>

              <div className="flex flex-col gap-1 text-xs text-gray-600">
                <span className="uppercase tracking-[0.16em]">Difficulty</span>
                <Dropdown
                  options={[
                    { value: 'Easy' },
                    { value: 'Average' },
                    { value: 'Difficult' },
                    { value: 'Clincher' },
                    { value: 'Sudden Death' },
                  ]}
                  onChange={(selected) => {
                    if (selected === 'Clincher' || selected === 'Sudden Death') {
                      handleSwitchToClincher(selected);
                    } else {
                      exitClincherRound(selected);
                      setDifficulty(selected);
                    }
                  }}
                  key={difficulty}
                  initialValue={difficulty}
                />
              </div>

              <div className="flex flex-col gap-1 text-xs text-gray-600">
                <span className="uppercase tracking-[0.16em]">Division</span>
                <Dropdown
                  options={[{ value: 'Individual' }, { value: 'Teams' }]}
                  onChange={async (selected) => {
                    setDivision(selected);
                    setDifficulty('Easy');
                    setCategory('Eliminations');
                    await performResetScores();
                  }}
                  initialValue={division}
                />
              </div>
            </div>

            <div className="mt-1 flex flex-wrap gap-2">
              <button className={buttonStyles} onClick={handleResetClick}>
                Reset scores
              </button>
              <button className={buttonStyles} onClick={handleRefreshClick}>
                Refresh app
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700">
              Leaderboard controls
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Select and rank colleges, then display the {category === 'Finals' ? 'Top 3' : 'Top 5'}{' '}
              on the main screen.
            </p>
          </div>

          <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-700">
            <ol className="list-decimal space-y-1 pl-4">
              <li>Drag a college name from the left pane.</li>
              <li>Drop it onto a bar to assign that rank.</li>
              <li>
                Click <span className="font-semibold text-sky-300">Display leaderboard</span> to send
                the ranked colleges to the display.
              </li>
            </ol>
          </div>

          <div className="mt-1 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Current leaderboard window</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.16em] ${
                  showLeaderboard
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {showLeaderboard ? 'Open' : 'Hidden'}
              </span>
            </div>

            <div className="mt-1 h-40 rounded border border-gray-300 bg-white px-3 py-3">
              <LeaderboardBars
                maxRank={maxPreviewRank}
                colleges={displayedColleges}
                collegeRankings={collegeRankings}
                onDropToRank={handleBarDrop}
              />
            </div>

            <div className="mt-4">
              <button
                className={`${buttonStyles} w-full justify-center`}
                onClick={toggleLeaderboard}
              >
                {showLeaderboard ? 'Close leaderboard' : 'Display leaderboard'}
              </button>
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}

function LeaderboardBars({
  maxRank,
  colleges,
  collegeRankings,
  onDropToRank,
}: {
  maxRank: number;
  colleges: College[];
  collegeRankings: { [key: string]: string };
  onDropToRank: (rankIndex: number, collegeId: string) => void;
}) {
  const slots = Array.from({ length: maxRank }, (_, index) => index);

  const getCollegeForRank = (rankLabel: string): College | undefined => {
    const entry = Object.entries(collegeRankings).find(
      ([, rank]) => rank === rankLabel
    );
    if (!entry) return undefined;

    const [collegeId] = entry;
    return colleges.find((college) => String(college.id) === collegeId);
  };

  const handleDropOnSlot = (event: DragEvent<HTMLDivElement>, slotIndex: number) => {
    event.preventDefault();
    const collegeId = event.dataTransfer.getData('text/plain');
    if (!collegeId) return;
    onDropToRank(slotIndex, collegeId);
  };

  const handleDragOverSlot = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="flex h-full items-end justify-between gap-2">
      {slots.map((slotIndex) => {
        const rankLabel = getRankLabelForIndex(slotIndex);
        const assignedCollege = getCollegeForRank(rankLabel);
        const numericRank = slotIndex + 1;
        const heightPercent =
          ((maxRank + 1 - numericRank) / maxRank) * 100;

        return (
          <div
            key={rankLabel}
            className="flex flex-1 flex-col items-center justify-end gap-1"
          >
            <div
              className={`flex w-full items-end justify-center rounded-t-xl border border-dashed border-slate-700 bg-slate-950/80 transition-colors ${
                assignedCollege
                  ? 'border-sky-400 bg-linear-to-t from-sky-500 to-sky-300'
                  : 'hover:border-sky-400/70 hover:bg-slate-900'
              }`}
              style={
                assignedCollege
                  ? { height: `${Math.max(24, heightPercent)}%` }
                  : { height: '24%' }
              }
              onDragOver={handleDragOverSlot}
              onDrop={(event) => handleDropOnSlot(event, slotIndex)}
            >
              {assignedCollege ? (
                <span className="mb-2 text-xs font-semibold text-slate-950">
                  {numericRank}
                </span>
              ) : (
                <span className="px-2 text-[0.6rem] font-medium uppercase tracking-[0.16em] text-white">
                  Drop here
                </span>
              )}
            </div>
            <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
              {assignedCollege ? assignedCollege.shorthand : rankLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ScoreButton({
  college,
  add,
  difficulty,
  updateScore,
}: {
  college: College;
  add: boolean;
  difficulty: string;
  updateScore: (
    college: College,
    offset: number,
    adjustRadius?: boolean
  ) => void;
}) {
  const changeScore = () => {
    const offset: number =
      (function (): number {
        switch (difficulty) {
          case 'Easy':
            return 5;
          case 'Average':
            return 10;
          case 'Difficult':
            return 15;
          case 'Clincher':
            return 1;
          case 'Sudden Death':
            return .5;
          default:
            return 1;
        }
      })() * (add ? 1 : -1);

    // Only adjust radius when adding points, not when subtracting
    updateScore(college, offset, add);
  };

  const styles = `py-1 px-3 rounded-xl m-1 text-sm ${
    add
      ? 'bg-green-400 hover:bg-green-500 cursor-pointer'
      : 'bg-red-400 hover:bg-red-500 cursor-pointer'
  }`;

  return (
    <button className={styles} onClick={changeScore}>
      {add ? '+' : '-'}
    </button>
  );
}

function Dropdown({
  options,
  onChange,
  initialValue,
  preventChange
}: {
  options: DropdownOption[];
  onChange?: (value: string) => void;
  initialValue?: string;
  preventChange?: boolean;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<string>(
    initialValue || options[0].value
  );

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return; // Do nothing if the option is disabled
    if (!preventChange) {
      setSelected(option.value);
    }
    setIsOpen(false);
    if (onChange) onChange(option.value);
  };

  return (
    <div className='relative w-52 h-[50%] p-2'>
      {/* Dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='w-full font-semibold py-2 p-2 bg-white border-2 border-gray-300 rounded-xl flex justify-between items-center cursor-pointer'
      >
        <span>{selected}</span>
        <span
          className={`ml-2 mr-1 text-xs duration-100 ${
            isOpen ? 'rotate-180 ' : ''
          }`}
        >
          ▼
        </span>
      </button>
      {/* Dropdown menu */}
      {isOpen && (
        <div className='overflow-visible absolute z-50 w-full mt-1 bg-white border rounded shadow'>
          <ul>
            {options.map((option) => (
              <li
                key={option.value}
                className={`p-2 hover:bg-gray-100 ${
                  option.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-black cursor-pointer'
                }`}
                onClick={() => handleSelect(option)}
              >
                {option.value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface DropdownOption {
  value: string;
  disabled?: boolean;
}