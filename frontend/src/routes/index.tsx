import { lazy, Suspense } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { Spinner } from '@/components/ui/Feedback'
import AdminLayout from '@/layouts/AdminLayout'
import PublicLayout from '@/layouts/PublicLayout'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'

const lazyPage = (C: React.LazyExoticComponent<React.ComponentType>) => (
  <Suspense fallback={<Spinner />}><C /></Suspense>
)
const Subjects = lazy(() => import('@/pages/Subjects'))
const SubjectDetail = lazy(() => import('@/pages/SubjectDetail'))
const Materials = lazy(() => import('@/pages/Materials'))
const MaterialDetail = lazy(() => import('@/pages/MaterialDetail'))
const Login = lazy(() => import('@/pages/admin/Login'))
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminSubjects = lazy(() => import('@/pages/admin/Subjects'))
const AdminCategories = lazy(() => import('@/pages/admin/Categories'))
const AdminMaterials = lazy(() => import('@/pages/admin/Materials'))

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/asignaturas', element: lazyPage(Subjects) },
      { path: '/asignaturas/:slug', element: lazyPage(SubjectDetail) },
      { path: '/materiales', element: lazyPage(Materials) },
      { path: '/materiales/:id', element: lazyPage(MaterialDetail) },
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '/admin/login', element: lazyPage(Login) },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: lazyPage(Dashboard) },
      { path: 'asignaturas', element: lazyPage(AdminSubjects) },
      { path: 'categorias', element: lazyPage(AdminCategories) },
      { path: 'materiales', element: lazyPage(AdminMaterials) },
    ],
  },
]

export const createRouter = () => createBrowserRouter(routes)
