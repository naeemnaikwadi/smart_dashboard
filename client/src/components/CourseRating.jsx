import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageCircle, Send } from 'lucide-react';
import axios from 'axios';

const CourseRating = ({ courseId, onRatingChange }) => {
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchRatings();
    }
  }, [courseId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if courseId exists
      if (!courseId) {
        setError('Course ID is required');
        return;
      }

      const response = await axios.get(`http://localhost:4000/api/courses/${courseId}/ratings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data) {
        setRatings(response.data || []);
      } else {
        setRatings([]);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      // If ratings endpoint doesn't exist, set empty array instead of error
      if (error.response?.status === 404) {
        setRatings([]);
        setError('');
      } else {
        setError('Failed to load ratings');
        setRatings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!userRating) {
      setError('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const ratingData = {
        rating: userRating,
        review: userReview,
        courseId: courseId
      };

      // Try the ratings endpoint first, fallback to rating endpoint
      let response;
      try {
        response = await axios.post(`http://localhost:4000/api/courses/${courseId}/ratings`, ratingData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (ratingError) {
        // Fallback to single rating endpoint
        if (ratingError.response?.status === 404) {
          response = await axios.post(`http://localhost:4000/api/courses/${courseId}/rate`, ratingData, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          throw ratingError;
        }
      }

      if (response.data) {
        setSuccess('Rating submitted successfully!');
        setUserRating(0);
        setUserReview('');
        
        // Refresh ratings
        await fetchRatings();
        
        // Notify parent component
        if (onRatingChange) {
          onRatingChange(response.data);
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAverageRating = () => {
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, r) => sum + r.rating, 0);
    return (total / ratings.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });
    return distribution;
  };

  const renderStars = (rating, interactive = false, size = 'w-5 h-5') => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : 'button'}
            onClick={interactive ? () => setUserRating(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            disabled={!interactive}
          >
            <Star className={size} fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const averageRating = calculateAverageRating();
  const ratingDistribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Course Rating</h3>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{averageRating}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">out of 5</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          {renderStars(parseFloat(averageRating), false, 'w-6 h-6')}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Based on {ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}
          </span>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{star}★</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${ratings.length > 0 ? (ratingDistribution[star] / ratings.length) * 100 : 0}%`
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                {ratingDistribution[star]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Rating Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rate This Course</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleRatingSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Rating
            </label>
            <div className="flex items-center gap-2">
              {renderStars(userRating, true, 'w-8 h-8')}
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                {userRating > 0 ? `${userRating} star${userRating > 1 ? 's' : ''}` : 'Select rating'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Review (Optional)
            </label>
            <textarea
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Share your experience with this course..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !userRating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </form>
      </div>

      {/* Recent Reviews */}
      {ratings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Recent Reviews
          </h3>
          
          <div className="space-y-4">
            {ratings.slice(0, 5).map((rating, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-600 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {rating.userName ? rating.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {rating.userName || 'Anonymous'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(rating.rating, false, 'w-4 h-4')}
                    <span className="text-sm text-gray-500">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {rating.review && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm ml-10">
                    {rating.review}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {ratings.length > 5 && (
            <div className="text-center mt-4">
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All Reviews ({ratings.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseRating;
