from math import ceil

from django.db.models import F
from django_comments import get_model

comment_model = get_model()


def get_comment_replies(comment):
    '''
    Returns queryset that contain all reply for given comment.
    '''
    return comment_model.objects.filter(
        parent_id=comment.pk
    ).exclude(parent_id=F('pk'))


def merge_profiles(target_profile, source_profile):
    from allauth.account.models import EmailAddress
    from allauth.socialaccount.models import SocialAccount
    from django.apps import apps

    from ajapaik.ajapaik.models import Album, AlbumPhoto, Dating, DatingConfirmation, DifficultyFeedback, GeoTag, \
        ImageSimilarity, ImageSimilaritySuggestion, MyXtdComment, Photo, PhotoLike, Points, Skip, Transcription, \
        TranscriptionFeedback
    from ajapaik.ajapaik_face_recognition.models import FaceRecognitionRectangle, FaceRecognitionRectangleFeedback, \
        FaceRecognitionRectangleSubjectDataSuggestion, FaceRecognitionUserSuggestion
    from ajapaik.ajapaik_object_recognition.models import ObjectAnnotationFeedback, ObjectDetectionAnnotation
    profile_querysets = [
        ('ajapaik', Album.objects.filter(profile=source_profile)),
        ('ajapaik', AlbumPhoto.objects.filter(profile=source_profile)),
        ('ajapaik', Dating.objects.filter(profile=source_profile)),
        ('ajapaik', DatingConfirmation.objects.filter(profile=source_profile)),
        ('ajapaik', PhotoLike.objects.filter(profile=source_profile)),
    ]

    user_querysets = [
        ('ajapaik_face_recognition', FaceRecognitionRectangle.objects.filter(user=source_profile)),
        ('ajapaik_face_recognition', FaceRecognitionRectangleFeedback.objects.filter(user=source_profile)),
        ('ajapaik_face_recognition', FaceRecognitionUserSuggestion.objects.filter(user=source_profile)),
        ('ajapaik', GeoTag.objects.filter(user=source_profile)),
        ('ajapaik_object_recognition', ObjectAnnotationFeedback.objects.filter(user=source_profile)),
        ('ajapaik_object_recognition', ObjectDetectionAnnotation.objects.filter(user=source_profile)),
        ('ajapaik', Photo.objects.filter(user=source_profile)),
        ('ajapaik', Points.objects.filter(user=source_profile)),
        ('ajapaik', Skip.objects.filter(user=source_profile)),
        ('ajapaik', Transcription.objects.filter(user=source_profile)),
        ('ajapaik', TranscriptionFeedback.objects.filter(user=source_profile))
    ]

    user_profile_querysets = [
        ('ajapaik', DifficultyFeedback.objects.filter(user_profile=source_profile))
    ]

    user_last_modified_querysets = [
        ('ajapaik', ImageSimilarity.objects.filter(user_last_modified=source_profile))
    ]

    proposer_querysets = [
        ('ajapaik_face_recognition',
         FaceRecognitionRectangleSubjectDataSuggestion.objects.filter(proposer=source_profile)),
        ('ajapaik', ImageSimilaritySuggestion.objects.filter(proposer=source_profile))
    ]

    queryset_dictionary = {'profile': profile_querysets, 'user': user_querysets, 'user_profile': user_profile_querysets,
                           'user_last_modified': user_last_modified_querysets, 'proposer': proposer_querysets}

    for key, value in queryset_dictionary.items():
        for app_queryset_tuple in value:
            for item in app_queryset_tuple[1]:
                setattr(item, key, target_profile)
            Model = apps.get_model(app_queryset_tuple[0], app_queryset_tuple[1].model.__name__)
            Model.objects.bulk_update(app_queryset_tuple[1], [key])

    comments = MyXtdComment.objects.filter(user_id=source_profile.id)
    for comment in comments:
        comment.user = target_profile.user
    MyXtdComment.objects.bulk_update(comments, ['user'])

    attributes = dir(source_profile)
    attributes.remove('facebook')
    attributes.remove('objects')
    attributes.remove('__weakref__')
    attributes.remove('deletion_attempted')
    for attribute in attributes:
        attr = getattr(target_profile, attribute)
        attr2 = getattr(source_profile, attribute)
        if attr is None and attr2 is not None:
            setattr(target_profile, attribute, attr2)
    target_profile.save()

    social_accounts = SocialAccount.objects.filter(user_id=source_profile.user_id)
    for social_account in social_accounts:
        social_account.user = target_profile.user
        social_account.save()

    emails = EmailAddress.objects.filter(user_id=source_profile.user_id)
    for email in emails:
        current_user_emails = EmailAddress.objects.filter(user_id=target_profile.user_id, primary=True)
        if current_user_emails is not None:
            email.primary = False
        email.user = target_profile.user
        email.save()

    if not target_profile.user.is_superuser and source_profile.user.is_superuser:
        target_profile.user.is_superuser = source_profile.user.is_superuser
    if not target_profile.user.is_staff and source_profile.user.is_staff:
        target_profile.user.is_staff = source_profile.user.is_staff
    if not target_profile.user.is_active and source_profile.user.is_active:
        target_profile.user.is_active = source_profile.user.is_active
    target_profile.user.save()


def get_pagination_parameters(page, page_size, photo_count):
    start = (page - 1) * page_size
    total = photo_count
    if start < 0:
        start = 0
    if start > total:
        start = total
    if int(start + page_size) > total:
        end = total
    else:
        end = start + page_size
    end = int(end)
    max_page = ceil(float(total) / float(page_size))

    if page > max_page:
        start, end, total, max_page, page = get_pagination_parameters(max_page, page_size, photo_count)

    return start, end, total, max_page, page
