package dev.clotet.suro.wear.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavType
import androidx.navigation.navArgument
import androidx.wear.compose.material3.AppScaffold
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import dev.clotet.suro.wear.ServiceLocator
import dev.clotet.suro.wear.auth.AuthState
import dev.clotet.suro.wear.ui.common.LoadState
import dev.clotet.suro.wear.ui.common.LoadingRow
import dev.clotet.suro.wear.ui.common.rememberFetcher
import dev.clotet.suro.wear.ui.calendar.CalendarScreen
import dev.clotet.suro.wear.ui.calendar.EventDetailScreen
import dev.clotet.suro.wear.ui.expenses.AddExpenseScreen
import dev.clotet.suro.wear.ui.expenses.PotDetailScreen
import dev.clotet.suro.wear.ui.expenses.PotsScreen
import dev.clotet.suro.wear.ui.groups.GroupsScreen
import dev.clotet.suro.wear.ui.home.HomeScreen
import dev.clotet.suro.wear.ui.lists.ListDetailScreen
import dev.clotet.suro.wear.ui.lists.ListsScreen
import dev.clotet.suro.wear.ui.setup.SetupScreen

private object Routes {
    const val HOME = "home"
    const val GROUPS = "groups"
    const val LISTS = "lists"
    const val LIST = "list/{listId}"
    const val CALENDAR = "calendar"
    const val EVENT = "event/{eventId}"
    const val POTS = "pots"
    const val POT = "pot/{potId}"
    const val ADD_EXPENSE = "pot/{potId}/add"

    fun list(id: String) = "list/$id"
    fun event(id: String) = "event/$id"
    fun pot(id: String) = "pot/$id"
    fun addExpense(id: String) = "pot/$id/add"
}

@Composable
fun SuroNavHost(locator: ServiceLocator) {
    val authState by locator.authRepository.state.collectAsStateWithLifecycle()

    // Pairing is a whole-app state, not a route: there is nothing to navigate to
    // until the phone hands over a session, and swiping back into a signed-out
    // screen shouldn't be possible. Unknown means the stored session is still
    // being checked — a beat of nothing beats a wrong screen.
    when (authState) {
        AuthState.Unpaired -> {
            SetupScreen(locator.pairingRequester)
            return
        }
        AuthState.Unknown -> {
            ScreenScaffold { LoadingRow() }
            return
        }
        AuthState.Paired -> Unit
    }

    val navController = rememberSwipeDismissableNavController()
    val api = locator.api
    var projectId by remember { mutableStateOf(locator.preferences.lastProjectId) }

    // Needed only to work out which balance in a pot is "yours". Derived rather
    // than held in state: assigning to a MutableState during composition is how
    // you get recomposition loops.
    val userFetcher = rememberFetcher(authState) { api.me() }
    val userState by userFetcher.state.collectAsStateWithLifecycle()
    val currentUserId = (userState as? LoadState.Content)?.value?.id

    AppScaffold {
        SwipeDismissableNavHost(navController = navController, startDestination = Routes.HOME) {
            composable(Routes.HOME) {
                HomeScreen(
                    loadProjects = { api.projects() },
                    activeProjectId = projectId,
                    onActiveProject = { project ->
                        projectId = project.id
                        locator.preferences.lastProjectId = project.id
                    },
                    onLists = { navController.navigate(Routes.LISTS) },
                    onCalendar = { navController.navigate(Routes.CALENDAR) },
                    onExpenses = { navController.navigate(Routes.POTS) },
                    onSwitchGroup = { navController.navigate(Routes.GROUPS) },
                )
            }

            composable(Routes.GROUPS) {
                GroupsScreen(
                    loadProjects = { api.projects() },
                    onSelect = { project ->
                        projectId = project.id
                        locator.preferences.lastProjectId = project.id
                        navController.popBackStack()
                    },
                )
            }

            composable(Routes.LISTS) {
                WithProject(projectId, navController::popBackStack) { id ->
                    ListsScreen(
                        projectId = id,
                        loadLists = { api.lists(it) },
                        onOpen = { navController.navigate(Routes.list(it.id)) },
                    )
                }
            }

            composable(Routes.LIST, arguments = listOf(navArgument("listId") { type = NavType.StringType })) {
                val listId = it.arguments?.getString("listId").orEmpty()
                ListDetailScreen(
                    listId = listId,
                    loadList = { id -> api.list(id) },
                    setCompleted = { itemId, completed -> api.setItemCompleted(itemId, completed) },
                )
            }

            composable(Routes.CALENDAR) {
                WithProject(projectId, navController::popBackStack) { id ->
                    CalendarScreen(
                        projectId = id,
                        loadEvents = { project, from, to -> api.events(project, from, to) },
                        onOpen = { event -> navController.navigate(Routes.event(event.id)) },
                    )
                }
            }

            composable(Routes.EVENT, arguments = listOf(navArgument("eventId") { type = NavType.StringType })) {
                val eventId = it.arguments?.getString("eventId").orEmpty()
                EventDetailScreen(
                    eventId = eventId,
                    loadEvent = { id -> api.event(id) },
                    setCompleted = { itemId, completed -> api.setItemCompleted(itemId, completed) },
                )
            }

            composable(Routes.POTS) {
                WithProject(projectId, navController::popBackStack) { id ->
                    PotsScreen(
                        projectId = id,
                        loadPots = { api.pots(it) },
                        onOpen = { pot -> navController.navigate(Routes.pot(pot.id)) },
                    )
                }
            }

            composable(Routes.POT, arguments = listOf(navArgument("potId") { type = NavType.StringType })) {
                val potId = it.arguments?.getString("potId").orEmpty()
                PotDetailScreen(
                    potId = potId,
                    currentUserId = currentUserId,
                    loadPot = { id -> api.pot(id) },
                    onAddExpense = { navController.navigate(Routes.addExpense(potId)) },
                )
            }

            composable(Routes.ADD_EXPENSE, arguments = listOf(navArgument("potId") { type = NavType.StringType })) {
                val potId = it.arguments?.getString("potId").orEmpty()
                AddExpenseScreen(
                    potId = potId,
                    currentUserId = currentUserId,
                    loadPot = { id -> api.pot(id) },
                    createSpending = { pot, cents, description, from, to ->
                        api.createSpending(pot, cents, description, from, to)
                    },
                    onDone = { navController.popBackStack() },
                )
            }
        }
    }
}

/**
 * Guards the project-scoped screens. A brand-new watch has no remembered group
 * until the user picks one, and every one of these queries needs a project id.
 */
@Composable
private fun WithProject(
    projectId: String?,
    onMissing: () -> Unit,
    content: @Composable (String) -> Unit,
) {
    if (projectId == null) {
        LaunchedEffect(Unit) { onMissing() }
        return
    }
    content(projectId)
}
